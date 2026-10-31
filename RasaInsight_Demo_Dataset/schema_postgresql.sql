-- RasaInsight demo schema (PostgreSQL / Supabase)
create table if not exists customers (
  customer_id text primary key, customer_name text not null, email text,
  phone text, city text, gender text, birth_date date, joined_at date,
  customer_status text
);
create table if not exists products (
  product_id text primary key, product_name text not null, category text,
  product_type text, price numeric(12,2), cost numeric(12,2), is_active boolean
);
create table if not exists transactions (
  transaction_id text primary key, customer_id text references customers(customer_id),
  transaction_datetime timestamp not null, sales_channel text, payment_method text,
  subtotal numeric(12,2), discount_amount numeric(12,2), tax_amount numeric(12,2),
  total_amount numeric(12,2), transaction_status text
);
create table if not exists transaction_details (
  detail_id text primary key, transaction_id text references transactions(transaction_id),
  product_id text references products(product_id), quantity integer,
  unit_price numeric(12,2), discount_percent numeric(5,2), line_total numeric(12,2)
);
create table if not exists feedbacks (
  feedback_id text primary key, customer_id text references customers(customer_id),
  transaction_id text references transactions(transaction_id), feedback_date date,
  rating integer, feedback_text text, source text, sentiment_label text, topic_label text
);
create table if not exists complaints (
  complaint_id text primary key, customer_id text references customers(customer_id),
  transaction_id text references transactions(transaction_id), complaint_date date,
  category text, subject text, description text, priority text, status text,
  resolved_date date, assigned_to text
);
create table if not exists loyalty_points (
  loyalty_transaction_id text primary key, customer_id text references customers(customer_id),
  transaction_id text references transactions(transaction_id), transaction_date timestamp,
  points_earned integer default 0, points_redeemed integer default 0, description text
);
create table if not exists users_demo (
  user_id text primary key, email text unique, role text, display_role text, display_name text
);

create index if not exists idx_transactions_customer on transactions(customer_id);
create index if not exists idx_transactions_datetime on transactions(transaction_datetime);
create index if not exists idx_details_transaction on transaction_details(transaction_id);
create index if not exists idx_feedback_customer on feedbacks(customer_id);
create index if not exists idx_complaints_status on complaints(status);
