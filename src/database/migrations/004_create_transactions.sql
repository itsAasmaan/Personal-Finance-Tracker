CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    notes TEXT,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    transfer_account_id INTEGER REFERENCES accounts(id),
    transfer_transaction_id INTEGER REFERENCES transactions(id),
    
    reference_number VARCHAR(100),
    location VARCHAR(255),
    tags TEXT[], 
    
    CONSTRAINT check_transfer_accounts 
        CHECK (
            (type = 'transfer' AND transfer_account_id IS NOT NULL) OR 
            (type != 'transfer' AND transfer_account_id IS NULL)
        )
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date ON transactions(user_id, type, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON transactions(account_id, transaction_date DESC);

DROP TRIGGER IF EXISTS update_transactions_updated_at on transactions;

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP FUNCTION IF EXISTS update_account_balance_on_transaction() CASCADE;

CREATE OR REPLACE FUNCTION update_account_balance_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
    account_balance DECIMAL(12, 2);
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'income' THEN
            UPDATE accounts 
            SET current_balance = current_balance + NEW.amount 
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE accounts 
            SET current_balance = current_balance - NEW.amount 
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'transfer' THEN
            UPDATE accounts 
            SET current_balance = current_balance - NEW.amount 
            WHERE id = NEW.account_id;
            
            UPDATE accounts 
            SET current_balance = current_balance + NEW.amount 
            WHERE id = NEW.transfer_account_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        IF OLD.type = 'income' THEN
            UPDATE accounts 
            SET current_balance = current_balance - OLD.amount 
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE accounts 
            SET current_balance = current_balance + OLD.amount 
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'transfer' THEN
            UPDATE accounts 
            SET current_balance = current_balance + OLD.amount 
            WHERE id = OLD.account_id;
            
            UPDATE accounts 
            SET current_balance = current_balance - OLD.amount 
            WHERE id = OLD.transfer_account_id;
        END IF;
        
        IF NEW.type = 'income' THEN
            UPDATE accounts 
            SET current_balance = current_balance + NEW.amount 
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE accounts 
            SET current_balance = current_balance - NEW.amount 
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'transfer' THEN
            UPDATE accounts 
            SET current_balance = current_balance - NEW.amount 
            WHERE id = NEW.account_id;
            
            UPDATE accounts 
            SET current_balance = current_balance + NEW.amount 
            WHERE id = NEW.transfer_account_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        IF OLD.type = 'income' THEN
            UPDATE accounts 
            SET current_balance = current_balance - OLD.amount 
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE accounts 
            SET current_balance = current_balance + OLD.amount 
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'transfer' THEN
            UPDATE accounts 
            SET current_balance = current_balance + OLD.amount 
            WHERE id = OLD.account_id;
            
            UPDATE accounts 
            SET current_balance = current_balance - OLD.amount 
            WHERE id = OLD.transfer_account_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_account_balance_trigger on transactions;

CREATE TRIGGER update_account_balance_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance_on_transaction();