import json
import logging
import requests
from app.config.settings import settings

logger = logging.getLogger(__name__)

def generate_investment_suggestions(
    available_cash: float,
    savings_rate: float,
    total_income: float,
    total_expense: float,
    total_savings: float,
    runway_months: float,
    risk_score: float,
    risk_profile: str,
    emergency_target: float,
    emergency_gap: float,
    portfolio_warnings: list
) -> list:
    """
    Calls Gemini API to generate 3 customized investment options (Low, Medium, High risk)
    based on the user's detailed financial snapshot and programmatic safety limits.
    """
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not set. Falling back to mock suggestions.")
        return get_mock_suggestions(
            available_cash, savings_rate, total_income, total_expense, total_savings,
            runway_months, risk_score, risk_profile, emergency_target, emergency_gap, portfolio_warnings
        )

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent"
    
    prompt = f"""
    You are a professional financial planner. Based on the user's financial profile, suggest EXACTLY 3 investment recommendations:
    1. Low Risk (Conservative, e.g. Index Mutual Funds, Gold, Govt Bonds)
    2. Medium Risk (Moderate, e.g. Blue-chip Stocks, REITs)
    3. High Risk (Aggressive, e.g. Growth Stocks, Small-cap Funds, Crypto)

    User Profile:
    - Monthly Income: {total_income:.2f}
    - Monthly Expenses: {total_expense:.2f}
    - Net Monthly Savings: {total_savings:.2f}
    - Savings Rate: {savings_rate:.1f}%
    - Available cash to invest (Safety-Capped Investable Amount): {available_cash:.2f}
    - Financial Runway: {runway_months:.1f} months
    - Emergency Fund Target (6 months expenses): {emergency_target:.2f}
    - Emergency Fund Gap: {emergency_gap:.2f}
    - Programmatic Risk Score: {risk_score:.0f}/100 (Profile: {risk_profile})
    - Portfolio Concentration/Diversification Warnings: {", ".join(portfolio_warnings) if portfolio_warnings else "None"}

    ALLOCATION RULES (Strictly enforce these based on Risk Profile: {risk_profile}):
    - If Profile is 'Conservative': Only recommend safe options (FD, govt schemes, gold, debt). Do not recommend stocks or crypto.
    - If Profile is 'Moderate': Recommend a balanced mix of index mutual funds, FDs, blue-chip stocks, and gold. Do not recommend crypto.
    - If Profile is 'Aggressive': You can include growth stocks and small-cap funds. You can include crypto, but its allocation must NEVER exceed 15% of the investable cash.
    - The sum of the 'recommended_allocation' across all 3 suggestions must exactly equal {available_cash:.2f}.
    - If there is an emergency gap (Gap: {emergency_gap:.2f} > 0), the first suggestion must address the emergency fund target (e.g. recommending Liquid Funds, short-term FD, or savings buffer). Recommend smaller test amounts for risky options.

    For each recommendation, provide the following fields in a valid JSON array of objects:
    - asset_name: Name of the asset (e.g. "Nifty 50 Index Fund", "Tata Motors Stock", "Bitcoin")
    - asset_type: One of: "stocks", "fixed_deposit", "mutual_funds", "gold", "govt_schemes", "real_estate"
    - risk_level: One of: "Low", "Medium", "High"
    - risk_score: Volatility rating as an integer from 1 to 10 (e.g. 1 for FD, 3 for index funds, 6 for blue-chip stocks, 9 for crypto)
    - expected_return_rate: Expected CAGR / annual return as a float (e.g., 7.5, 12.0, 30.0)
    - recommended_allocation: Recommended amount to invest from their available cash (e.g. 5000, 10000). Must be less than or equal to available cash.
    - allocation_rationale: JSON array of 3 strings (in Hinglish/Hindi or English) explaining why this specific amount and asset is recommended based on their savings rate, risk score, runway, and warnings.
    - holding_period: Recommended holding horizon (e.g., "5+ Years", "3-5 Years", "1-2 Years")
    - pros: JSON array of 3 advantages/pros of this asset.
    - cons: JSON array of 3 unsugarcoated disadvantages/cons (risks, drawbacks, fees, maximum temporary drop expectations). Do not sugarcoat.
    - risk_protection: JSON array of 3-4 reasons why this asset has built-in protection (e.g. "Regulated by SEBI", "50+ companies diversification", "Physical backing").
    - liquidity: "Yes" or "No"
    - ticker: For stocks, the NSE symbol (e.g., "TCS", "INFY", "RELIANCE"). For mutual funds, a short search query (e.g., "NIFTY50"). For gold, "GOLD".
    - historical_data: JSON object containing actual historical price/NAV or interest rates for 1, 3, 5, 10 years ago. Set to null if not available.
      Structure for market-linked (stocks, mutual_funds, gold, ETFs): {{ "current_price": float, "periods": {{ "1": float_price_1y_ago, "3": float_price_3y_ago, "5": float_price_5y_ago, "10": float_price_10y_ago }} }}
      Structure for fixed return (fixed_deposit, bonds): {{ "interest_rates": {{ "1": float_rate_1y_ago, "3": float_rate_3y_ago, "5": float_rate_5y_ago, "10": float_rate_10y_ago }} }}

    Respond ONLY with the raw JSON array. Do not include markdown formatting, backticks, or any conversational text.
    """

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": settings.GEMINI_API_KEY
    }
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        res_data = response.json()
        
        # Extract response text
        content_text = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        # Clean markdown code blocks if any got returned despite instructions
        if content_text.startswith("```"):
            lines = content_text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].strip() == "```":
                lines = lines[:-1]
            content_text = "\n".join(lines).strip()
            
        suggestions = json.loads(content_text)
        if isinstance(suggestions, list) and len(suggestions) > 0:
            return suggestions
            
    except Exception as e:
        logger.error(f"Failed to fetch Gemini investment suggestions: {e}")
        
    return get_mock_suggestions(
        available_cash, savings_rate, total_income, total_expense, total_savings,
        runway_months, risk_score, risk_profile, emergency_target, emergency_gap, portfolio_warnings
    )

def get_mock_suggestions(
    available_cash: float,
    savings_rate: float,
    total_income: float,
    total_expense: float,
    total_savings: float,
    runway_months: float,
    risk_score: float,
    risk_profile: str,
    emergency_target: float,
    emergency_gap: float,
    portfolio_warnings: list
) -> list:
    """Fallback high-fidelity mock suggestions that dynamically align with the computed risk profile and safety caps."""
    # Ensure available_cash is positive
    cash = max(1000.0, available_cash)
    
    if risk_profile == "Conservative":
        rec_fd = round(cash * 0.70, -2)
        rec_index = round(cash * 0.20, -2)
        rec_gold = round(cash * 0.10, -2)
        # Handle rounding adjustments so sum is exactly cash
        diff = cash - (rec_fd + rec_index + rec_gold)
        rec_fd += diff
        
        return [
            {
                "asset_name": "SBI 1-Year Fixed Deposit",
                "asset_type": "fixed_deposit",
                "risk_level": "Low",
                "risk_score": 1,
                "expected_return_rate": 7.0,
                "recommended_allocation": max(0.0, rec_fd),
                "allocation_rationale": [
                    f"Your runway ({runway_months:.1f} months) is low. A Fixed Deposit guarantees safety for your emergency corpus.",
                    "Sovereign backing ensures principal guarantee with no market correlation.",
                    "Stable 7% interest rate helps grow emergency capital with zero risk."
                ],
                "holding_period": "1 Year",
                "pros": ["Principal amount guaranteed", "Fixed predictable returns", "Highly liquid via premature withdrawal"],
                "cons": ["Returns are fully taxable", "Fails to beat high inflation", "Interest rate locked if market rates rise"],
                "risk_protection": ["RBI deposit insurance up to 5 Lakhs", "Backed by India's largest public bank", "Fixed returns independent of stock market"],
                "liquidity": "Yes",
                "ticker": "SBI-FD",
                "historical_data": {
                    "interest_rates": {
                        "1": 7.0,
                        "3": 6.5,
                        "5": 6.25,
                        "10": 7.5
                    }
                }
            },
            {
                "asset_name": "UTI Nifty 50 Index Fund",
                "asset_type": "mutual_funds",
                "risk_level": "Low",
                "risk_score": 3,
                "expected_return_rate": 12.0,
                "recommended_allocation": max(0.0, rec_index),
                "allocation_rationale": [
                    "Moderate equity allocation added to provide a safety buffer for your profile.",
                    "Low expense ratio allows maximum returns on core compounding.",
                    "India's economic growth captured in 50 largest blue-chip companies."
                ],
                "holding_period": "5+ Years",
                "pros": ["Low-cost index diversification", "SEBI regulated security", "Consistent 12-13% historical compounding"],
                "cons": ["Market volatility risk in short term", "Subject to capital gains tax", "No outperformance of market average"],
                "risk_protection": ["Spread across 50 top Indian companies", "Daily liquidity tracking", "Fully regulated by SEBI"],
                "liquidity": "Yes",
                "ticker": "NIFTY50",
                "historical_data": {
                    "current_price": 24500.0,
                    "periods": {
                        "1": 23200.0,
                        "3": 18600.0,
                        "5": 15700.0,
                        "10": 8100.0
                    }
                }
            },
            {
                "asset_name": "Sovereign Gold Bonds (SGB)",
                "asset_type": "gold",
                "risk_level": "Low",
                "risk_score": 2,
                "expected_return_rate": 8.5,
                "recommended_allocation": max(0.0, rec_gold),
                "allocation_rationale": [
                    "Gold acts as a safe-haven asset class in times of market stress.",
                    "Govt scheme pays an additional 2.5% annual interest on gold bond value.",
                    "Tax-free capital gains if held until maturity (8 years)."
                ],
                "holding_period": "5-8 Years",
                "pros": ["2.5% fixed annual interest bonus", "Sovereign guarantee backing", "Exempt from capital gains tax at maturity"],
                "cons": ["Fixed lock-in period of 5-8 years", "No immediate physical access", "Dependent on global gold spot prices"],
                "risk_protection": ["Issued by RBI on behalf of Govt of India", "Zero storage cost or making charges", "Backed by physical gold value indexing"],
                "liquidity": "No",
                "ticker": "GOLD",
                "historical_data": {
                    "current_price": 7200.0,
                    "periods": {
                        "1": 6100.0,
                        "3": 4800.0,
                        "5": 3800.0,
                        "10": 2800.0
                    }
                }
            }
        ]
        
    elif risk_profile == "Moderate":
        rec_index = round(cash * 0.50, -2)
        rec_fd = round(cash * 0.25, -2)
        rec_stock = round(cash * 0.25, -2)
        diff = cash - (rec_index + rec_fd + rec_stock)
        rec_index += diff
        
        return [
            {
                "asset_name": "HDFC Index Nifty 50 Fund",
                "asset_type": "mutual_funds",
                "risk_level": "Low",
                "risk_score": 3,
                "expected_return_rate": 12.0,
                "recommended_allocation": max(0.0, rec_index),
                "allocation_rationale": [
                    "Allows core diversified exposure suitable for moderate savers.",
                    "Provides compounding foundation with low tracking error.",
                    f"Recommended since savings rate is stable at {savings_rate:.0f}%."
                ],
                "holding_period": "5+ Years",
                "pros": ["Instant diversification across sectors", "Extremely low expense ratio", "Long term historical track record"],
                "cons": ["Subject to short-term market crashes", "No active alpha generation", "No dividend distribution choice"],
                "risk_protection": ["Top 50 Indian companies diversification", "SEBI regulatory framework", "Continuous exchange trading and redemption"],
                "liquidity": "Yes",
                "ticker": "NIFTY50",
                "historical_data": {
                    "current_price": 24500.0,
                    "periods": {
                        "1": 23200.0,
                        "3": 18600.0,
                        "5": 15700.0,
                        "10": 8100.0
                    }
                }
            },
            {
                "asset_name": "Tata Motors Stock",
                "asset_type": "stocks",
                "risk_level": "Medium",
                "risk_score": 6,
                "expected_return_rate": 16.5,
                "recommended_allocation": max(0.0, rec_stock),
                "allocation_rationale": [
                    "Tata Group growth stock aligned with EV trend.",
                    "Higher risk matched with strong commercial sales outlook.",
                    "Recommended to capture active capital appreciation."
                ],
                "holding_period": "3-5 Years",
                "pros": ["Dominant leader in EV passenger cars", "Tata Group strong corporate backing", "Robust order book and revenue tailwinds"],
                "cons": ["Automotive sector cyclical industry risk", "Higher volatility than mutual funds", "High valuation multiples limit short gains"],
                "risk_protection": ["Diverse operations across global markets", "Stringent NSE stock exchange regulations", "Excellent corporate governance standard"],
                "liquidity": "Yes",
                "ticker": "TATOMOTORS",
                "historical_data": {
                    "current_price": 950.0,
                    "periods": {
                        "1": 900.0,
                        "3": 560.0,
                        "5": 340.0,
                        "10": 430.0
                    }
                }
            },
            {
                "asset_name": "SBI 1-Year Fixed Deposit",
                "asset_type": "fixed_deposit",
                "risk_level": "Low",
                "risk_score": 1,
                "expected_return_rate": 7.0,
                "recommended_allocation": max(0.0, rec_fd),
                "allocation_rationale": [
                    "Guarantees short-term security for emergency runway balance.",
                    "Provides fixed yield to balance volatile stock assets.",
                    "Acts as a liquid buffer for immediate liquidity."
                ],
                "holding_period": "1 Year",
                "pros": ["Predictable capital returns", "Zero downside volatility", "Premature loan options available"],
                "cons": ["Taxes drag net yield lower", "Returns locked below rising inflation", "Interest rate is fixed"],
                "risk_protection": ["RBI DICGC protection up to 5 Lakhs", "Backed by SBI capital reserves", "Independent of market trends"],
                "liquidity": "Yes",
                "ticker": "SBI-FD",
                "historical_data": {
                    "interest_rates": {
                        "1": 7.0,
                        "3": 6.5,
                        "5": 6.25,
                        "10": 7.5
                    }
                }
            }
        ]
        
    else: # Aggressive
        rec_index = round(cash * 0.35, -2)
        rec_stock = round(cash * 0.50, -2)
        rec_crypto = round(cash * 0.15, -2) # Crypto capped at 15%
        diff = cash - (rec_index + rec_stock + rec_crypto)
        rec_stock += diff
        
        return [
            {
                "asset_name": "HDFC Index Nifty 50 Fund",
                "asset_type": "mutual_funds",
                "risk_level": "Low",
                "risk_score": 3,
                "expected_return_rate": 12.0,
                "recommended_allocation": max(0.0, rec_index),
                "allocation_rationale": [
                    "Core Nifty 50 exposure provides market-rate foundation.",
                    "Highly liquid baseline asset to anchor the aggressive portfolio.",
                    f"Allows compounding base at {savings_rate:.0f}% savings rate."
                ],
                "holding_period": "5+ Years",
                "pros": ["Low-cost index diversification", "Instant sector exposure", "Regulated by SEBI"],
                "cons": ["Subject to short-term market crashes", "Tracking error risk", "No alpha outperformance"],
                "risk_protection": ["Distributed across top 50 sectors", "Highly liquid structure", "Under SEBI oversight"],
                "liquidity": "Yes",
                "ticker": "NIFTY50",
                "historical_data": {
                    "current_price": 24500.0,
                    "periods": {
                        "1": 23200.0,
                        "3": 18600.0,
                        "5": 15700.0,
                        "10": 8100.0
                    }
                }
            },
            {
                "asset_name": "Reliance Industries Stock",
                "asset_type": "stocks",
                "risk_level": "Medium",
                "risk_score": 5,
                "expected_return_rate": 15.0,
                "recommended_allocation": max(0.0, rec_stock),
                "allocation_rationale": [
                    "India's largest company by market cap, capturing retail/telecom growth.",
                    "Consistent dividend payer with high capital appreciation runway.",
                    "Provides direct exposure to active domestic conglomerate growth."
                ],
                "holding_period": "3-5 Years",
                "pros": ["Dominant telecommunications (Jio) market share", "Strong cash flow generating oil-to-chemicals segment", "Expansion into green energy initiatives"],
                "cons": ["Conglomerate discount can apply", "High capital expenditure demands", "Regulatory shifts in telecom pricing"],
                "risk_protection": ["Diverse business segments hedge risks", "Massive institutional holdings support price", "Strict compliance with NSE exchange rules"],
                "liquidity": "Yes",
                "ticker": "RELIANCE",
                "historical_data": {
                    "current_price": 2900.0,
                    "periods": {
                        "1": 2550.0,
                        "3": 2100.0,
                        "5": 1300.0,
                        "10": 480.0
                    }
                }
            },
            {
                "asset_name": "Bitcoin (BTC)",
                "asset_type": "stocks", # Asset types map to options, stocks fits crypto interface
                "risk_level": "High",
                "risk_score": 9,
                "expected_return_rate": 35.0,
                "recommended_allocation": max(0.0, rec_crypto),
                "allocation_rationale": [
                    "Capped at 15% maximum allocation to manage extreme downside risk.",
                    "High-alpha digital asset acting as a global hedge.",
                    "High savings rate allows absorbing potential volatility."
                ],
                "holding_period": "5+ Years",
                "pros": ["Asymmetric high returns potential", "Decentralized cryptographic ledger security", "Limited fixed supply hedge against inflation"],
                "cons": ["Extreme price swings (-50% in weeks)", "Uncertain regulatory landscape in India", "Zero asset backing or dividend earnings"],
                "risk_protection": ["Immutability of blockchain network", "24/7 global trading liquidity", "Sovereign spot ETF listings in US markets"],
                "liquidity": "Yes",
                "ticker": "BTC-USD",
                "historical_data": {
                    "current_price": 5700000.0,
                    "periods": {
                        "1": 5000000.0,
                        "3": 2200000.0,
                        "5": 3000000.0,
                        "10": 45000.0
                    }
                }
            }
        ]

