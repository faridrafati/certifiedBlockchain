const { expect } = require("chai");
const { ethers } = require("hardhat");

// Feature bit helpers (mirror ForgeTypes.Features ids)
const F = {
  REMOVE_CREDITS: 1, CUSTOM_DECIMALS: 2, SUPPLY_CAPPED: 3, SUPPLY_UNLIMITED: 4,
  ACCESS_OWNABLE: 5, ACCESS_ROLES: 6, PAUSABLE: 7, BURNABLE: 8, MINTABLE: 9,
  BATCH_OPS: 10, WHITELIST: 11, BLACKLIST: 12, CONTROLLED: 13, REFLECTION: 14,
  TAXABLE: 15, ANTI_WHALE: 16, LP_SETUP: 17, DEFLATIONARY: 18, CALLBACK: 19,
  PERMIT: 20, AUTH_3009: 21, URWA: 22, TOKEN_RECOVER: 23,
};
const bit = (...ids) => ids.reduce((m, id) => m | (1n << BigInt(id)), 0n);

const ZERO = "0x0000000000000000000000000000000000000000";
const e = (n) => ethers.parseEther(String(n));

// Build a default TokenConfig struct (tuple order must match ForgeTypes.TokenConfig)
function cfg(overrides = {}) {
  return {
    name: "Test Token",
    symbol: "TST",
    decimals_: 18,
    initialSupply: e(1_000_000),
    maxSupply: 0,
    featureBitmap: 0n,
    owner_: ZERO, // factory overwrites with msg.sender
    buyTaxBps: 0, sellTaxBps: 0, transferTaxBps: 0, taxWallet: ZERO,
    burnBps: 0, maxTxBps: 0, maxWalletBps: 0, reflectionFeeBps: 0,
    ...overrides,
  };
}
const noLP = { tokenAmount: 0, nativeAmount: 0 };

describe("TokenForge", function () {
  let deployer, factory, owner, treasury, alice, bob;

  beforeEach(async function () {
    [owner, treasury, alice, bob] = await ethers.getSigners();
    const Deployer = await ethers.getContractFactory("ForgeTokenDeployer");
    deployer = await Deployer.deploy();
    const Factory = await ethers.getContractFactory("TokenFactory");
    // basePrice 0.05 ETH, multiplier 1.0x (10000 bps)
    factory = await Factory.deploy(owner.address, treasury.address, e(0.05), 10000, await deployer.getAddress());
  });

  // ---- pricing ----------------------------------------------------
  describe("pricing", function () {
    it("requiredFee = base for a plain fixed/no-access token", async function () {
      expect(await factory.requiredFee(0n)).to.equal(e(0.05));
    });

    it("sums selected feature prices", async function () {
      // base 0.05 + burnable 0.10 + permit 0.15 = 0.30
      const bm = bit(F.BURNABLE, F.PERMIT);
      expect(await factory.requiredFee(bm)).to.equal(e(0.30));
    });

    it("applies the network multiplier (0.2x L2)", async function () {
      await factory.setNetworkMultiplier(2000);
      // (0.05 + 0.10) * 0.2 = 0.03
      expect(await factory.requiredFee(bit(F.BURNABLE))).to.equal(e(0.03));
    });

    it("testnet multiplier of 0 makes everything free", async function () {
      await factory.setNetworkMultiplier(0);
      expect(await factory.requiredFee(bit(F.TAXABLE, F.ANTI_WHALE))).to.equal(0n);
    });

    it("admin can change a feature price and it reprices", async function () {
      await factory.setFeaturePrice(F.BURNABLE, e(1));
      expect(await factory.requiredFee(bit(F.BURNABLE))).to.equal(e(1.05));
    });
  });

  // ---- payment validation ----------------------------------------
  describe("payment", function () {
    it("reverts when msg.value < required fee", async function () {
      await expect(
        factory.connect(alice).createToken(cfg(), noLP, { value: e(0.04) })
      ).to.be.revertedWithCustomError(factory, "InsufficientFee");
    });

    it("refunds overpayment", async function () {
      const fee = await factory.requiredFee(0n);
      const over = e(1);
      const before = await ethers.provider.getBalance(alice.address);
      const tx = await factory.connect(alice).createToken(cfg(), noLP, { value: over });
      const rcpt = await tx.wait();
      const gas = rcpt.gasUsed * rcpt.gasPrice;
      const after = await ethers.provider.getBalance(alice.address);
      // alice should be down only fee + gas, not the full overpayment
      expect(before - after).to.equal(fee + gas);
    });

    it("treasury receives the fee on withdraw, not the buyer", async function () {
      const fee = await factory.requiredFee(0n);
      await factory.connect(alice).createToken(cfg(), noLP, { value: fee });
      const before = await ethers.provider.getBalance(treasury.address);
      await factory.connect(owner).withdraw();
      const after = await ethers.provider.getBalance(treasury.address);
      expect(after - before).to.equal(fee);
    });
  });

  // ---- validateConfig (dependency/conflict matrix) ---------------
  describe("validateConfig", function () {
    const bad = async (bm, reason) =>
      expect(factory.validateConfig(bm)).to.be.revertedWithCustomError(factory, "InvalidConfig");

    it("rejects capped+unlimited together", async () => bad(bit(F.SUPPLY_CAPPED, F.SUPPLY_UNLIMITED)));
    it("rejects ownable+roles together", async () => bad(bit(F.ACCESS_OWNABLE, F.ACCESS_ROLES)));
    it("rejects capped without mintable", async () => bad(bit(F.SUPPLY_CAPPED, F.ACCESS_OWNABLE)));
    it("rejects mintable without access", async () => bad(bit(F.MINTABLE)));
    it("rejects taxable without access", async () => bad(bit(F.TAXABLE)));
    it("rejects reflection with mintable", async () => bad(bit(F.REFLECTION, F.MINTABLE, F.ACCESS_OWNABLE)));
    it("rejects reflection with capped supply", async () => bad(bit(F.REFLECTION, F.SUPPLY_CAPPED, F.MINTABLE, F.ACCESS_OWNABLE)));
    it("rejects urwa without roles", async () => bad(bit(F.URWA, F.ACCESS_OWNABLE, F.WHITELIST)));
    it("rejects urwa without whitelist", async () => bad(bit(F.URWA, F.ACCESS_ROLES)));

    it("accepts a valid capped+mintable+ownable config", async function () {
      await expect(factory.validateConfig(bit(F.SUPPLY_CAPPED, F.MINTABLE, F.ACCESS_OWNABLE))).to.not.be.reverted;
    });
  });

  // ---- deployment & ownership ------------------------------------
  describe("createToken", function () {
    it("deploys a token owned by the buyer with the initial supply", async function () {
      const fee = await factory.requiredFee(0n);
      const tx = await factory.connect(alice).createToken(cfg({ initialSupply: e(500) }), noLP, { value: fee });
      const rcpt = await tx.wait();
      const ev = rcpt.logs.map(l => { try { return factory.interface.parseLog(l); } catch { return null; } }).find(l => l && l.name === "TokenCreated");
      expect(ev).to.not.be.undefined;
      const token = await ethers.getContractAt("ForgeToken", ev.args.token);
      expect(await token.owner()).to.equal(alice.address);
      expect(await token.balanceOf(alice.address)).to.equal(e(500));
      expect(await token.totalSupply()).to.equal(e(500));
      expect(await factory.getTokenCount()).to.equal(1n);
    });

    it("forces ownership to msg.sender even if cfg lies", async function () {
      const fee = await factory.requiredFee(0n);
      const tx = await factory.connect(alice).createToken(cfg({ owner_: bob.address }), noLP, { value: fee });
      const rcpt = await tx.wait();
      const ev = rcpt.logs.map(l => { try { return factory.interface.parseLog(l); } catch { return null; } }).find(l => l && l.name === "TokenCreated");
      const token = await ethers.getContractAt("ForgeToken", ev.args.token);
      expect(await token.owner()).to.equal(alice.address); // not bob
    });

    it("rejects reflection/urwa/lp as coming-soon", async function () {
      const bm = bit(F.REFLECTION);
      const fee = await factory.requiredFee(bm);
      await expect(
        factory.connect(alice).createToken(cfg({ featureBitmap: bm }), noLP, { value: fee })
      ).to.be.revertedWithCustomError(factory, "InvalidConfig");
    });

    it("respects the factory pause circuit breaker", async function () {
      await factory.connect(owner).setPaused(true);
      const fee = await factory.requiredFee(0n);
      await expect(
        factory.connect(alice).createToken(cfg(), noLP, { value: fee })
      ).to.be.revertedWithCustomError(factory, "InvalidConfig");
    });
  });

  // ---- token feature behaviour & gating --------------------------
  async function make(bm, over = {}) {
    const fee = await factory.requiredFee(bm);
    const tx = await factory.connect(alice).createToken(cfg({ featureBitmap: bm, ...over }), noLP, { value: fee });
    const rcpt = await tx.wait();
    const ev = rcpt.logs.map(l => { try { return factory.interface.parseLog(l); } catch { return null; } }).find(l => l && l.name === "TokenCreated");
    return ethers.getContractAt("ForgeToken", ev.args.token);
  }

  describe("feature gating", function () {
    it("burn reverts when Burnable not purchased", async function () {
      const t = await make(0n);
      await expect(t.connect(alice).burn(e(1))).to.be.revertedWithCustomError(t, "FeatureDisabled");
    });

    it("burn works when Burnable purchased", async function () {
      const t = await make(bit(F.BURNABLE));
      await t.connect(alice).burn(e(1));
      expect(await t.totalSupply()).to.equal(e(1_000_000) - e(1));
    });

    it("mint reverts when not Mintable", async function () {
      const t = await make(0n);
      await expect(t.connect(alice).mint(alice.address, e(1))).to.be.revertedWithCustomError(t, "FeatureDisabled");
    });

    it("custom decimals are honoured", async function () {
      const t = await make(bit(F.CUSTOM_DECIMALS), { decimals_: 6 });
      expect(await t.decimals()).to.equal(6);
    });

    it("default decimals are 18 without the feature", async function () {
      const t = await make(0n);
      expect(await t.decimals()).to.equal(18);
    });

    it("credit string present by default, blank when Remove Credits bought", async function () {
      const plain = await make(0n);
      expect(await plain.generator()).to.contain("TokenForge");
      const clean = await make(bit(F.REMOVE_CREDITS));
      expect(await clean.generator()).to.equal("");
    });
  });

  describe("anti-honeypot guards", function () {
    it("caps a single tax at 10%", async function () {
      // taxable needs access; set buyTax above cap. The revert originates in the
      // ForgeToken constructor, so match the error against ForgeToken's interface.
      const ForgeToken = await ethers.getContractFactory("ForgeToken");
      const bm = bit(F.TAXABLE, F.ACCESS_OWNABLE);
      const fee = await factory.requiredFee(bm);
      await expect(
        factory.connect(alice).createToken(cfg({ featureBitmap: bm, buyTaxBps: 1500, taxWallet: alice.address }), noLP, { value: fee })
      ).to.be.revertedWithCustomError(ForgeToken, "FeeTooHigh");
    });

    it("enforces the anti-whale 0.1% floor on setLimits", async function () {
      const bm = bit(F.ANTI_WHALE, F.ACCESS_OWNABLE);
      const t = await make(bm, { maxTxBps: 100, maxWalletBps: 200 });
      // supply 1,000,000 -> floor = 0.1% = 1000 tokens. Try to set below floor.
      await expect(t.connect(alice).setLimits(e(1), e(5000))).to.be.revertedWithCustomError(t, "LimitTooLow");
      // setting 0 (disabled) is allowed
      await expect(t.connect(alice).setLimits(0, 0)).to.not.be.reverted;
    });

    it("taxable transfer routes the fee to the tax wallet", async function () {
      const bm = bit(F.TAXABLE, F.ACCESS_OWNABLE);
      const t = await make(bm, { transferTaxBps: 500, taxWallet: treasury.address }); // 5%
      // alice (excluded) -> bob is NOT taxed since alice is fee-excluded; move bob->carol where neither excluded
      await t.connect(alice).transfer(bob.address, e(1000)); // alice excluded, no fee
      const carol = (await ethers.getSigners())[4]; // distinct from owner/treasury/alice/bob
      await t.connect(bob).transfer(carol.address, e(100)); // 5% fee -> 5 to treasury
      expect(await t.balanceOf(carol.address)).to.equal(e(95));
      expect(await t.balanceOf(treasury.address)).to.equal(e(5));
    });
  });
});
