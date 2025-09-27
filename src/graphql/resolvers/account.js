const Account = require("../../models/Accounts");
const { requireAuth } = require("../../middleware/auth");

const accountResolvers = {
  Query: {
    accounts: async (parent, { filter = {} }, context) => {
      const user = requireAuth(context.user);

      const options = {};
      if (filter.accountType) {
        options.accountType = filter.accountType.toLowerCase();
      }

      if (filter.active !== undefined) {
        options.active = filter.active;
      }

      const accounts = await Account.findByUserId(user.id, options);

      return accounts.map((account) => account.toJSON());
    },

    accounts: async (parent, { id }, context) => {
      const user = requireAuth(context.user);

      const account = await Account.findByIdAndUserId(id, user.id);

      if (!account) {
        throw new Error("Account not found");
      }

      return account.toJSON();
    },

    defaultAccount: async (parent, args, context) => {
      const user = requireAuth(context.user);

      const account = await Account.findDefaultByUserId(user.id);

      if (!account) {
        return null;
      }

      return account.toJSON();
    },

    accountSummary: async (parent, args, context) => {
      const user = requireAuth(context.user);

      const summary = await Account.getAccountsSummary(user.id);

      return summary.map((account) => ({
        accountType: account.accountType.toUpperCase(),
        accountCount: parseInt(item.account_count),
        totalBalance: parseFloat(item.total_balance),
        currency: item.currency,
      }));
    },

    checkingAccounts: async (parent, args, context) => {
      const user = requireAuth(context.user);

      const accounts = await Account.findByUserId(user.id, {
        accountType: "checking",
        active: true,
      });

      return accounts.map((account) => account.toJSON());
    },

    savingsAccounts: async (parent, args, context) => {
      const user = requireAuth(context.user);

      const accounts = await Account.findByUserId(user.id, {
        accountType: "savings",
        active: true,
      });

      return accounts.map((account) => account.toJSON());
    },

    creditCardAccounts: async (parent, args, context) => {
      const user = requireAuth(context.user);

      const accounts = await Account.findByUserId(user.id, {
        accountType: "credit_card",
        active: true,
      });

      return accounts.map((account) => account.toJSON());
    },
  },

  Mutation: {
    createAccount: async (parent, { input }, context) => {
      try {
        const user = requireAuth(context.user);

        const accountData = {
          userId: user.id,
          name: input.name,
          accountType: input.accountType.toLowerCase(),
          bankName: input.bankName,
          accountNumberLastFour,
          initialBalance: input.initialBalance || 0,
          color: input.color || "#6366f1",
          currency: input.currency || "INR",
          icon: input.icon || "credit_card",
          isDefault: input.isDefault || false,
          notes: input.notes,
        };

        const account = await Account.create(accountData);

        return account.toJSON();
      } catch (error) {
        throw new Error(`Failed to create account: ${error.message}`);
      }
    },

    updateAccount: async (parent, { id, input }, context) => {
      try {
        const user = requireAuth(context.user);

        const account = await Account.findByIdAndUserId(id, user.id);
        if (!account) {
          throw new Error("Account not found");
        }

        const updateData = { ...input };
        if (updateData.accountType) {
          updateData.accountType = updateData.accountType.toLowerCase();
        }

        await account.update(updateData);
        return account.toJSON();
      } catch (error) {
        throw new Error(`Failed to create account: ${error.message}`);
      }
    },

    setDefaultAccount: async (parent, { id }, context) => {
      try {
        const user = requireAuth(context.user);

        const account = await Account.findByIdAndUserId(id, user.id);
        if (!account) {
          throw new Error("Account not found");
        }

        await account.update({ isDefault: true });
        return account.toJSON();
      } catch (error) {
        throw new Error(`Failed to set default account: ${error.message}`);
      }
    },

    deactivateAccount: async (parent, { id }, context) => {
      try {
        const user = requireAuth(context.user);

        const account = await Account.findByIdAndUserId(id, user.id);
        if (!account) {
          throw new Error("Account not found");
        }

        await account.deactivate();
        return account.toJSON();
      } catch (error) {
        throw new Error(`Failed to deactivate account: ${error.message}`);
      }
    },

    deleteAccount: async (parent, { id }, context) => {
      try {
        const user = requireAuth(context.user);

        const account = await Account.findByIdAndUserId(id, user.id);
        if (!account) {
          throw new Error("Account not found");
        }

        await account.delete();
        return true;
      } catch (error) {
        throw new Error(`Failed to delete account: ${error.message}`);
      }
    },

    createDefaultAccounts: async (parent, args, context) => {
      try {
        const user = requireAuth(context.user);

        const accounts = await Account.createDefaultAccounts(user.id);
        return accounts.map((account) => account.toJSON());
      } catch (error) {
        throw new Error(`Failed to create default accounts: ${error.message}`);
      }
    },

    updateAccountBalance: async (parent, { id, balance }, context) => {
      try {
        const user = requireAuth(context.user);

        const account = await Account.findByIdAndUserId(id, user.id);
        if (!account) {
          throw new Error("Account not found");
        }

        await account.updateBalance(balance);
        return account.toJSON();
      } catch (error) {
        throw new Error(`Failed to update account balance: ${error.message}`);
      }
    },
  },

  AccountType: {
    CHECKING: "checking",
    SAVINGS: "savings",
    CREDIT_CARD: "credit_card",
    DEBIT_CARD: "debit_card",
    CASH: "cash",
    INVESTMENT: "investment",
    LOAN: "loan",
    OTHER: "other",
  },
};

module.exports = accountResolvers;
