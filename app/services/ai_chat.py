import requests
import json
import logging
import re
from app.config.settings import settings
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.transaction import Transaction, TransactionType
from app.models.investment import Investment, InvestmentStatus
from app.models.savings import SavingsGoal
from datetime import datetime

logger = logging.getLogger(__name__)

def sanitize_pii(text: str) -> str:
    if not text:
        return ""
    # Mask Emails
    text = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', '[EMAIL]', text)
    # Mask Phone Numbers
    text = re.sub(r'\+?\d[\d -]{8,12}\d', '[PHONE]', text)
    # Mask Bank Accounts / Card Numbers
    text = re.sub(r'\b\d{9,18}\b', '[ACCOUNT_NO]', text)
    return text

def generate_chat_response(
    query: str,
    active_tab: str,
    financial_data: dict,
    chat_history: list,
    db: Session = None,
    user_id: int = None
) -> str:
    """
    Sends contextual prompt containing user profile data and active tab guidelines
    to Gemini API, returning the formatted chatbot response.
    """
    # Sanitize transaction descriptions for PII masking before sending to AI
    if 'transactions' in financial_data:
        sanitized_txns = []
        for txn in financial_data['transactions']:
            txn_copy = txn.copy()
            if 'description' in txn_copy and txn_copy['description']:
                txn_copy['description'] = sanitize_pii(txn_copy['description'])
            sanitized_txns.append(txn_copy)
        financial_data['transactions'] = sanitized_txns

    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not set. Chatbot fallback triggered.")
        return generate_local_fallback_response(query, active_tab, financial_data, db, user_id)

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent"

    # Section-specific context instructions
    tab_guidelines = {
        "dashboard": (
            "Provide an overview of the user's current command center dashboard. "
            "Help them check key high-level statistics like total net savings, income, expenses, and savings rate."
        ),
        "analytics": (
            "Analyze cash flow metrics, category mixes (housing, food, transport, utilities), and saving/burning trends. "
            "Explain where their money is going and offer budget-cut recommendations."
        ),
        "savings": (
            "Review and analyze the user's active savings goals. Recommend strategies to achieve goals faster. "
            "Reference emergency reserve guidelines (at least 3-6 months of expenses)."
        ),
        "investments": (
            "Evaluate portfolio asset allocations, suitability indices, and risk profiles. "
            "Provide details on market assets, CAGR growth, and compound projections."
        ),
        "transactions": (
            "Examine transaction histories, specific transaction item categorization, or search filters."
        )
    }

    tab_instruction = tab_guidelines.get(active_tab, tab_guidelines["dashboard"])

    system_instruction = f"""
    You are 'Capitallens AI Advisor', an interactive, premium personal finance assistant.
    The user is currently viewing the '{active_tab}' tab in the application.

    Current Tab Guideline:
    {tab_instruction}

    User Financial Snapshot:
    - Total All-time Income: ₹{financial_data.get('total_income', 0.0):,.2f}
    - Monthly Expenses: ₹{financial_data.get('total_expense', 0.0):,.2f}
    - Net Savings: ₹{financial_data.get('total_savings', 0.0):,.2f}
    - Savings Rate: {financial_data.get('savings_rate', 0.0):.1f}%
    - Runway: {financial_data.get('runway_months', 0.0):.1f} months
    - Total Capital Staged in Investments: ₹{financial_data.get('total_invested', 0.0):,.2f}

    User Savings Goals:
    {json.dumps(financial_data.get('goals', []), indent=2)}

    User Investment Portfolio:
    {json.dumps(financial_data.get('investments', []), indent=2)}

    User Transaction Logs (Last 120):
    {json.dumps(financial_data.get('transactions', []), indent=2)}

    Instructions for formatting responses:
    1. Language & Persona: Respond in a natural, friendly personal advisor tone. If the user writes or asks in Hinglish (Hindi + English), reply primarily in helpful, natural Hinglish. Otherwise, use English.
    2. Format all numbers as Indian Rupees (e.g. ₹5,000 or ₹1,20,000) where applicable.
    3. Action Tags (Deep Linking): If referencing an action the user can perform or suggesting they view a tab, append a custom action tag at the end of the text. 
       Format: `[action:navigate:TAB_NAME:BUTTON_LABEL]`
       - Example: "Aap apne active savings goals dekhne ke liye yahan click kar sakte hain: [action:navigate:savings:Open Savings Goals]"
       - Allowed TAB_NAMEs: 'dashboard', 'analytics', 'savings', 'investments', 'transactions'.
    4. Progress Tags (Inline UI Components): If referencing the completion progress of a savings goal, include this custom tag:
       Format: `[progress:GOAL_NAME:PROGRESS_PERCENTAGE]`
       - Example: "Aapka goal [progress:Euro Summer '25:72] complete ho chuka hai."
    5. Chart Tags (Inline preview with zoom chart modal): If the user asks for a chart, visual comparison, or trend of amounts (e.g., daily spends, top income days), append a custom chart tag:
       Format: `[chart:bar:labels=LABEL1,LABEL2:values=VAL1,VAL2:title=CHART_TITLE]`
       - Example: "[chart:bar:labels=2026-06-01,2026-06-02:values=5000,12000:title=Daily Spends Comparison]"
    6. Table Tags (Inline preview with zoom table modal): If the user asks for list of transactions, category totals, or structured logs, append a custom table tag:
       Format: `[table:headers=COL1,COL2:rows=VAL1|VAL2;VAL3|VAL4:title=TABLE_TITLE]`
       - Example: "[table:headers=Date,Amount,Category:rows=2026-06-01|₹5,000.00|Rent;2026-06-02|₹1,200.00|Food:title=Transaction History Table]"
    7. Be crisp and readably structured. Use bold titles or bullet points.
    8. Always include a brief disclaimer at the end: "*Disclaimer: AI-generated guidance is for educational purposes and is not SEBI-registered advisory.*"
    """

    # Assemble chat history
    contents = []
    for msg in chat_history:
        contents.append({
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [{"text": msg["content"]}]
        })

    # Add the current message
    contents.append({
        "role": "user",
        "parts": [{"text": query}]
    })

    payload = {
        "contents": contents,
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        }
    }

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": settings.GEMINI_API_KEY
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=25)
        response.raise_for_status()
        res_data = response.json()
        return res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        logger.error(f"Failed to fetch response from Gemini: {e}")
        return generate_local_fallback_response(query, active_tab, financial_data, db, user_id)


def query_transactions_db(
    db: Session,
    user_id: int,
    type_str: str = None,
    category: str = None,
    start_date: str = None,
    end_date: str = None,
    min_amount: float = None,
    max_amount: float = None,
    description: str = None,
    sort_by: str = "date_desc",
    limit: int = 50
) -> list:
    query = db.query(Transaction).filter(Transaction.user_id == user_id)
    if type_str:
        query = query.filter(Transaction.type == (TransactionType.income if type_str.lower() == 'income' else TransactionType.expense))
    if category:
        query = query.filter(Transaction.category.ilike(f"%{category}%"))
    if start_date:
        try:
            query = query.filter(Transaction.date >= datetime.strptime(start_date, "%Y-%m-%d"))
        except: pass
    if end_date:
        try:
            query = query.filter(Transaction.date <= datetime.strptime(end_date, "%Y-%m-%d"))
        except: pass
    if min_amount is not None:
        query = query.filter(Transaction.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Transaction.amount <= max_amount)
    if description:
        query = query.filter(Transaction.description.ilike(f"%{description}%"))
        
    if sort_by == "amount_desc":
        query = query.order_by(Transaction.amount.desc())
    elif sort_by == "amount_asc":
        query = query.order_by(Transaction.amount.asc())
    elif sort_by == "date_asc":
        query = query.order_by(Transaction.date.asc())
    else:
        query = query.order_by(Transaction.date.desc())
        
    results = query.limit(limit).all()
    return [
        {
            "amount": float(t.amount),
            "type": t.type.value if hasattr(t.type, 'value') else str(t.type),
            "category": t.category,
            "description": t.description,
            "date": t.date.strftime("%Y-%m-%d") if t.date else None
        }
        for t in results
    ]


def aggregate_transactions_db(
    db: Session,
    user_id: int,
    type_str: str,
    group_by: str,
    start_date: str = None,
    end_date: str = None,
    sort_by: str = "total_desc",
    limit: int = 10
) -> list:
    t_type = TransactionType.income if type_str.lower() == 'income' else TransactionType.expense
    group_field = Transaction.date if group_by == "day" else Transaction.category
    
    agg_query = db.query(group_field, func.sum(Transaction.amount).label("total")).filter(
        Transaction.user_id == user_id,
        Transaction.type == t_type
    )
    if start_date:
        try:
            agg_query = agg_query.filter(Transaction.date >= datetime.strptime(start_date, "%Y-%m-%d"))
        except: pass
    if end_date:
        try:
            agg_query = agg_query.filter(Transaction.date <= datetime.strptime(end_date, "%Y-%m-%d"))
        except: pass
        
    agg_query = agg_query.group_by(group_field)
    
    if sort_by == "total_asc":
        agg_query = agg_query.order_by(func.sum(Transaction.amount).asc())
    else:
        agg_query = agg_query.order_by(func.sum(Transaction.amount).desc())
        
    results = agg_query.limit(limit).all()
    return [
        {
            "group": r[0].strftime("%Y-%m-%d") if isinstance(r[0], datetime) else str(r[0]),
            "total": float(r[1])
        }
        for r in results
    ]


def generate_local_fallback_response(query: str, active_tab: str, data: dict, db: Session = None, user_id: int = None) -> str:
    query_lower = query.lower()
    income = data.get('total_income', 0.0)
    expense = data.get('total_expense', 0.0)
    savings = data.get('total_savings', 0.0)
    savings_rate = data.get('savings_rate', 0.0)
    runway = data.get('runway_months', 0.0)
    invested = data.get('total_invested', 0.0)
    goals = data.get('goals', [])
    investments = data.get('investments', [])

    disclaimer = "\n\n*Disclaimer: Local fallback advisor active. Guidance is for educational purposes and is not SEBI-registered.*"

    # Identity / Name query fallback
    if "name" in query_lower or "naam" in query_lower or "who are you" in query_lower or "kon ho" in query_lower or "kaun ho" in query_lower:
        return (
            "Mera naam **Capitallens AI Advisor** hai! Main aapka personal finance advisor assistant hoon. "
            "Main aapke portfolio breakdown, expenses analytics, active savings goals aur market investments ke details analyze kar sakta hoon. "
            "Aap mujhse koi bhi financial ya transaction report query pooch sakte hain!"
            + disclaimer
        )

    # Greeting queries fallback
    if query_lower.strip() in ["hi", "hello", "hey", "hola", "namaste", "pranam"]:
        return (
            "Hello! I'm your **Capitallens AI Advisor**. I can analyze your portfolio, savings goals, and expense data to give you personalized suggestions. \n"
            "What would you like to explore today? \n"
            "\u2022 [action:navigate:analytics:View Analytics]\n"
            "\u2022 [action:navigate:savings:View Savings Goals]\n"
            "\u2022 [action:navigate:investments:View Investments]"
            + disclaimer
        )

    # Specific Query: 3 maximum income transaction days / transactions
    if "income" in query_lower and ("max" in query_lower or "highest" in query_lower or "largest" in query_lower or "maximum" in query_lower or "top" in query_lower or "days" in query_lower or "bada" in query_lower or "badi" in query_lower):
        if db and user_id:
            db_days = aggregate_transactions_db(db, user_id, type_str="income", group_by="day", limit=5)
            db_txns = query_transactions_db(db, user_id, type_str="income", sort_by="amount_desc", limit=5)
            sorted_days = [(d['group'], d['total']) for d in db_days]
            sorted_txns = db_txns
        else:
            txns = data.get('transactions', [])
            income_txns = [t for t in txns if t['type'].lower() == 'income']
            daily_totals = {}
            for t in income_txns:
                d = t['date'] or "Unknown Date"
                daily_totals[d] = daily_totals.get(d, 0.0) + t['amount']
            sorted_days = sorted(daily_totals.items(), key=lambda x: x[1], reverse=True)[:5]
            sorted_txns = sorted(income_txns, key=lambda x: x['amount'], reverse=True)[:5]
        
        if not sorted_days:
            return (
                "Aapke account me abhi tak koi income transaction record nahi mila hai. "
                "Transactions tab me naya record add karne ke liye: [action:navigate:transactions:Add Income]"
                + disclaimer
            )
            
        days_labels = ",".join([str(d[0]) for d in sorted_days])
        days_values = ",".join([str(d[1]) for d in sorted_days])
        
        row_items = []
        for t in sorted_txns:
            date_val = t.get('date') or "Unknown Date"
            amt_val = f"₹{t.get('amount', 0.0):,.2f}"
            desc_val = t.get('description') or t.get('category') or 'Income'
            row_items.append(f"{date_val}|{amt_val}|{desc_val}")
        table_rows = ";".join(row_items)

        res = "Aapke top maximum income days ka details report ready hai. Aap ise visual chart ya detailed table overlay me zoom karke dekh sakte hain:\n\n"
        res += f"[chart:bar:labels={days_labels}:values={days_values}:title=Income Comparison (Top Days)]\n"
        res += f"[table:headers=Date,Amount,Source:rows={table_rows}:title=Income Transactions Report]\n\n"
        res += "Aap overall transaction logs list bhi check kar sakte hain: [action:navigate:transactions:Open Transactions Tab]"
        return res + disclaimer

    # Specific Query: maximum expense transactions / spending days
    if ("expense" in query_lower or "expanse" in query_lower or "spend" in query_lower or "spent" in query_lower or "spending" in query_lower or "kharch" in query_lower) and ("max" in query_lower or "highest" in query_lower or "largest" in query_lower or "maximum" in query_lower or "top" in query_lower or "days" in query_lower or "bada" in query_lower or "badi" in query_lower):
        if db and user_id:
            db_days = aggregate_transactions_db(db, user_id, type_str="expense", group_by="day", limit=5)
            db_txns = query_transactions_db(db, user_id, type_str="expense", sort_by="amount_desc", limit=5)
            sorted_days = [(d['group'], d['total']) for d in db_days]
            sorted_txns = db_txns
        else:
            txns = data.get('transactions', [])
            expense_txns = [t for t in txns if t['type'].lower() == 'expense']
            daily_totals = {}
            for t in expense_txns:
                d = t['date'] or "Unknown Date"
                daily_totals[d] = daily_totals.get(d, 0.0) + t['amount']
            sorted_days = sorted(daily_totals.items(), key=lambda x: x[1], reverse=True)[:5]
            sorted_txns = sorted(expense_txns, key=lambda x: x['amount'], reverse=True)[:5]
        
        if not sorted_days:
            return (
                "Aapke account me abhi tak koi expense transaction record nahi mila hai."
                + disclaimer
            )
            
        days_labels = ",".join([str(d[0]) for d in sorted_days])
        days_values = ",".join([str(d[1]) for d in sorted_days])
        
        row_items = []
        for t in sorted_txns:
            date_val = t.get('date') or "Unknown Date"
            amt_val = f"₹{t.get('amount', 0.0):,.2f}"
            desc_val = t.get('description') or t.get('category') or 'Expense'
            row_items.append(f"{date_val}|{amt_val}|{desc_val}")
        table_rows = ";".join(row_items)

        res = "Aapke top maximum expense days ka complete details report ready hai:\n\n"
        res += f"[chart:bar:labels={days_labels}:values={days_values}:title=Expense Comparison (Top Days)]\n"
        res += f"[table:headers=Date,Amount,Category:rows={table_rows}:title=Expense Transactions Report]\n\n"
        res += "Runway dynamics and breakdown checks: [action:navigate:analytics:Open Analytics Tab]"
        return res + disclaimer

    # Specific Category Spend query
    category_keywords = ["food", "housing", "transport", "utilities", "travel", "entertainment", "gadgets", "other", "rent", "salary", "investment"]
    matched_cats = [cat for cat in category_keywords if cat in query_lower]
    
    if matched_cats and ("spend" in query_lower or "spent" in query_lower or "expense" in query_lower or "income" in query_lower or "total" in query_lower or "how much" in query_lower):
        if db and user_id:
            rows_list = []
            for cat in matched_cats:
                t_type = TransactionType.income if cat in ["salary", "investment"] else TransactionType.expense
                total = db.query(func.sum(Transaction.amount)).filter(
                    Transaction.user_id == user_id,
                    Transaction.type == t_type,
                    Transaction.category.ilike(f"%{cat}%")
                ).scalar() or 0.0
                
                label = "Received" if t_type == TransactionType.income else "Spent"
                rows_list.append(f"{cat.capitalize()}|{label}|₹{total:,.2f}")
            table_rows = ";".join(rows_list)
                
            res = "Aapke requested categories ka historical all-time report ready hai:\n\n"
            res += f"[table:headers=Category,Type,All-time Total:rows={table_rows}:title=Category Summary Report]\n\n"
            res += "Analytics panel filter settings check karein: [action:navigate:analytics:Open Analytics Tab]"
            return res + disclaimer

    # Command: /summary
    if "/summary" in query_lower or "summary" in query_lower or "overall" in query_lower or "health" in query_lower:
        return (
            f"### Executive Financial Summary\n"
            f"Aapki current financial health breakdown niche diya gaya hai:\n\n"
            f"\u2022 **Monthly Income**: ₹{income:,.2f}\n"
            f"\u2022 **Monthly Expenses**: ₹{expense:,.2f}\n"
            f"\u2022 **Net Savings**: ₹{savings:,.2f}\n"
            f"\u2022 **Savings Rate**: {savings_rate:.1f}% (Recommended: 30%+)\n"
            f"\u2022 **Runway**: {runway:.1f} months\n"
            f"\u2022 **Total Capital Staged in Investments**: ₹{invested:,.2f}\n\n"
            f"Aapki savings rate stable hai. Analytics section me deep insights check karein: [action:navigate:analytics:Open Analytics Tab]"
            + disclaimer
        )

    # Command: /savings or "savings" or "goal"
    if "/savings" in query_lower or "savings" in query_lower or "goal" in query_lower:
        goal_text = ""
        if goals:
            goal_text = "\n".join([f"\u2022 **{g['title']}**: [progress:{g['title']}:{int(g['progress_percentage'])}]" for g in goals])
        else:
            goal_text = "\u2022 Koi active savings goal nahi mila."

        return (
            f"### Savings & Goals Analysis\n"
            f"Aapka current savings rate **{savings_rate:.1f}%** hai (Net Savings: ₹{savings:,.2f}).\n\n"
            f"**Active Savings Goals Status:**\n{goal_text}\n\n"
            f"Emergency Fund safety margin standard benchmark ke according secure hai. Goals customize karne ke liye: [action:navigate:savings:Manage Goals]"
            + disclaimer
        )

    # Command: /invest or "invest" or "portfolio" or "allocation"
    if "/invest" in query_lower or "invest" in query_lower or "portfolio" in query_lower or "allocation" in query_lower:
        available_cash = max(0.0, savings - invested)
        portfolio_text = ""
        if investments:
            portfolio_text = "\n".join([f"\u2022 **{inv['asset_name']}** ({inv['asset_type']}): ₹{inv['amount_invested']:,.2f}" for inv in investments])
        else:
            portfolio_text = "\u2022 Portfolio me koi active investment nahi hai."

        return (
            f"### Investment & Asset Advisory\n"
            f"Aapka total invested capital ₹{invested:,.2f} hai.\n\n"
            f"**Current Portfolio:**\n{portfolio_text}\n\n"
            f"Aapke paas current available investable cash **₹{available_cash:,.2f}** hai. "
            f"Hum recommend karte hain ek diversified model: 40% Low-risk Index funds, 40% Medium-risk Blue-chips, aur 20% Liquid reserves.\n\n"
            f"Live model allocations aur suggestions dekhne ke liye: [action:navigate:investments:Open Investment Advisory]"
            + disclaimer
        )

    # Runway specific
    if "runway" in query_lower or "safe" in query_lower:
        return (
            f"### Expense Runway Evaluation\n"
            f"Aapka current runway **{runway:.1f} months** hai (₹{savings:,.2f} net savings divided by ₹{expense:,.2f} monthly expenses).\n\n"
            f"\u2022 **6+ Months**: Ideal safety zone.\n"
            f"\u2022 **3-6 Months**: Moderate safety zone.\n"
            f"\u2022 **Under 3 Months**: Aggressive zone (expenses cut-down recommend hai).\n\n"
            f"Aapka runway safely secure hai! Detailed income-expense ratios: [action:navigate:analytics:Open Analytics Tab]"
            + disclaimer
        )

    # Expense specific
    if "expense" in query_lower or "spend" in query_lower or "budget" in query_lower:
        return (
            f"### Budget & Spending Analysis\n"
            f"Aapka monthly expense ₹{expense:,.2f} hai, jo ki aapke income ka **{((expense/income*100) if income > 0 else 0):.1f}%** hai.\n\n"
            f"Hum suggest karte hain 50/30/20 rule: 50% Needs, 30% Wants, 20% Savings. "
            f"Category breakdown check karne ke liye: [action:navigate:analytics:Open Spend Mix]"
            + disclaimer
        )

    # Help command
    if "/help" in query_lower or "help" in query_lower or "how to" in query_lower:
        return (
            f"### Advisor Help Guide\n"
            f"Main capitallens metrics aur statistics analyze karke help kar sakta hoon. Aap ye quick commands use kar sakte hain:\n\n"
            f"\u2022 `/summary` — Pure portfolio ki diagnostic report.\n"
            f"\u2022 `/savings` — Active goals aur emergency fund status.\n"
            f"\u2022 `/invest` — Allocations recommendations aur risk levels.\n"
            f"\u2022 `/help` — Help guidelines aur shortcuts.\n\n"
            f"Aap simple language me query type karke bhi pooch sakte hain (Hinglish/English supported)."
            + disclaimer
        )

    # General reply referencing their main statistics
    return (
        f"Aapke query ke respect me main aapko financial stats detail share kar sakta hoon:\n\n"
        f"Aapka current savings rate **{savings_rate:.1f}%** hai, monthly cash savings ₹{savings:,.2f} hai, aur runway {runway:.1f} months hai. "
        f"Aap kis section ke details discuss karna chahte hain? \n"
        f"\u2022 [action:navigate:analytics:Open Analytics]\n"
        f"\u2022 [action:navigate:savings:Open Savings]\n"
        f"\u2022 [action:navigate:investments:Open Investments]\n"
        + disclaimer
    )
