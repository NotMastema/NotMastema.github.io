const { useState, useMemo, useEffect } = React;

const MONTHLY_THRESHOLD = 6666.67;
const COMMISSION_RATE = 0.20;

// Google Apps Script URL - update this with your actual URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzGs5fEx1ko33yot_9Q7kO55nK-XE7w_huQAOLLclI0QY2AnP12MorOlQkS6xpW8p3VQ/exec';

// No fallback data for security - data must be loaded from Google Sheets
const fallbackDeals = [];

const CommissionTracker = () => {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastSync, setLastSync] = useState(null);
    const [expandedYears, setExpandedYears] = useState({'2025': true});
    const [expandedMonths, setExpandedMonths] = useState({});
    const [showDeals, setShowDeals] = useState(false);
    const [showAddDeal, setShowAddDeal] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [sellingDays, setSellingDays] = useState(() => {
        const saved = localStorage.getItem('currentMonthSellingDays');
        return saved ? JSON.parse(saved) : {};
    });
    const [monthlyGoals, setMonthlyGoals] = useState(() => {
        const saved = localStorage.getItem('monthlyGoals');
        return saved ? JSON.parse(saved) : {};
    });
    const [newDeal, setNewDeal] = useState({
        name: '',
        close: new Date().toISOString().split('T')[0],
        subscription: '',
        setup: '',
        cycle: 'six-month'
    });

    // Fetch deals from Google Sheets on component mount
    useEffect(() => {
        fetchDealsFromSheet();
    }, []);

    // Save deals to localStorage when they change
    useEffect(() => {
        if (deals.length > 0) {
            localStorage.setItem('commissionDeals', JSON.stringify(deals));
        }
    }, [deals]);

    // Save selling days to localStorage when they change
    useEffect(() => {
        localStorage.setItem('currentMonthSellingDays', JSON.stringify(sellingDays));
    }, [sellingDays]);

    // Save monthly goals to localStorage when they change
    useEffect(() => {
        localStorage.setItem('monthlyGoals', JSON.stringify(monthlyGoals));
    }, [monthlyGoals]);

    const fetchDealsFromSheet = async () => {
        setLoading(true);
        setError(null);

        try {
            // Check if Apps Script URL is configured
            if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL === 'PASTE_YOUR_APPS_SCRIPT_URL_HERE') {
                console.log('Apps Script URL not configured, using fallback data');
                const saved = localStorage.getItem('commissionDeals');
                setDeals(saved ? JSON.parse(saved) : fallbackDeals);
                setLastSync(new Date().toISOString());
                setLoading(false);
                return;
            }

            const response = await fetch(GOOGLE_APPS_SCRIPT_URL);
            const result = await response.json();

            if (result.success && result.data) {
                setDeals(result.data);
                setLastSync(result.timestamp || new Date().toISOString());
                console.log(`Loaded ${result.data.length} deals from Google Sheets`);
            } else {
                throw new Error(result.error || 'Failed to fetch deals');
            }
        } catch (err) {
            console.error('Error fetching from Google Sheets:', err);
            setError(err.message);

            // Fall back to localStorage or fallback deals
            const saved = localStorage.getItem('commissionDeals');
            setDeals(saved ? JSON.parse(saved) : fallbackDeals);
        } finally {
            setLoading(false);
        }
    };

    const addNewDeal = () => {
        if (!newDeal.name || !newDeal.subscription) return;

        const deal = {
            id: Math.max(...deals.map(d => d.id), 0) + 1,
            name: newDeal.name,
            close: newDeal.close,
            subscription: parseFloat(newDeal.subscription),
            setup: parseFloat(newDeal.setup) || 0,
            cycle: newDeal.cycle,
            churnDate: null
        };

        setDeals([...deals, deal]);
        setNewDeal({
            name: '',
            close: new Date().toISOString().split('T')[0],
            subscription: '',
            setup: '',
            cycle: 'six-month'
        });
    };

    const setChurnDate = (dealId, date) => {
        setDeals(deals.map(d => d.id === dealId ? {...d, churnDate: date} : d));
    };

    const removeChurn = (dealId) => {
        setDeals(deals.map(d => d.id === dealId ? {...d, churnDate: null} : d));
    };

    const monthlyBreakdown = useMemo(() => {
        const breakdown = {};
        const endDate = new Date('2027-12-31');

        deals.forEach(deal => {
            const closeDate = new Date(deal.close);
            const churnDate = deal.churnDate ? new Date(deal.churnDate) : null;
            let currentDate = new Date(closeDate);

            let renewalMonths;
            if (deal.cycle === "monthly") renewalMonths = 1;
            else if (deal.cycle === "three-month") renewalMonths = 3;
            else if (deal.cycle === "six-month") renewalMonths = 6;
            else if (deal.cycle === "yearly") renewalMonths = 12;
            else if (deal.cycle === "two-year") renewalMonths = 24;

            let isFirstPayment = true;

            while (currentDate <= endDate) {
                if (churnDate && currentDate > churnDate) break;

                const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

                if (!breakdown[monthKey]) {
                    breakdown[monthKey] = { revenue: 0, deals: [] };
                }

                const amount = isFirstPayment ? deal.setup + deal.subscription : deal.subscription;
                breakdown[monthKey].revenue += amount;
                breakdown[monthKey].deals.push({
                    name: deal.name,
                    amount: amount,
                    type: isFirstPayment ? 'new' : 'renewal'
                });

                isFirstPayment = false;
                currentDate.setMonth(currentDate.getMonth() + renewalMonths);
            }
        });

        Object.keys(breakdown).forEach(month => {
            const revenue = breakdown[month].revenue;
            breakdown[month].commission = revenue > MONTHLY_THRESHOLD ?
                (revenue - MONTHLY_THRESHOLD) * COMMISSION_RATE : 0;
            breakdown[month].overThreshold = revenue - MONTHLY_THRESHOLD;
        });

        return breakdown;
    }, [deals]);

    const yearlyBreakdown = useMemo(() => {
        const years = {};
        Object.entries(monthlyBreakdown).forEach(([monthKey, data]) => {
            const year = monthKey.split('-')[0];
            if (!years[year]) {
                years[year] = { commission: 0, revenue: 0, months: {} };
            }
            years[year].commission += data.commission;
            years[year].revenue += data.revenue;
            years[year].months[monthKey] = data;
        });
        return years;
    }, [monthlyBreakdown]);

    // Only count commission from completed months (excluding current and future months)
    const totalCommission = useMemo(() => {
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        return Object.entries(monthlyBreakdown).reduce((sum, [monthKey, data]) => {
            // Only include months that are before the current month
            if (monthKey < currentMonthKey) {
                return sum + data.commission;
            }
            return sum;
        }, 0);
    }, [monthlyBreakdown]);

    const activeDeals = deals.filter(d => !d.churnDate || new Date(d.churnDate) > new Date());

    // Calculate business days elapsed in current month (excluding weekends)
    const getBusinessDaysElapsed = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();

        let businessDays = 0;
        for (let day = 1; day <= today; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            // Skip weekends (0 = Sunday, 6 = Saturday)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                businessDays++;
            }
        }
        return businessDays;
    };

    // Current month attainment
    const currentMonthData = useMemo(() => {
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const currentMonth = monthlyBreakdown[currentMonthKey] || { revenue: 0, commission: 0, deals: [] };

        const businessDaysElapsed = getBusinessDaysElapsed();
        const totalSellingDays = sellingDays[currentMonthKey] || 20; // Default to 20 if not set
        const monthlyGoal = monthlyGoals[currentMonthKey] || MONTHLY_THRESHOLD; // Default to threshold if not set

        const daysProgress = (businessDaysElapsed / totalSellingDays) * 100;

        // Quota attainment (against static threshold)
        const quotaProgress = (currentMonth.revenue / MONTHLY_THRESHOLD) * 100;
        const quotaAttainment = totalSellingDays > 0 ? (quotaProgress / daysProgress) * 100 : 0;
        const expectedQuotaRevenue = (MONTHLY_THRESHOLD / totalSellingDays) * businessDaysElapsed;
        const quotaVariance = currentMonth.revenue - expectedQuotaRevenue;

        // Goal attainment (against custom goal)
        const goalProgress = (currentMonth.revenue / monthlyGoal) * 100;
        const goalAttainment = totalSellingDays > 0 ? (goalProgress / daysProgress) * 100 : 0;
        const expectedGoalRevenue = (monthlyGoal / totalSellingDays) * businessDaysElapsed;
        const goalVariance = currentMonth.revenue - expectedGoalRevenue;

        return {
            monthKey: currentMonthKey,
            revenue: currentMonth.revenue,
            commission: currentMonth.commission,
            businessDaysElapsed,
            totalSellingDays,
            monthlyGoal,
            daysProgress,
            // Quota metrics
            quotaProgress,
            quotaAttainment,
            expectedQuotaRevenue,
            quotaVariance,
            // Goal metrics
            goalProgress,
            goalAttainment,
            expectedGoalRevenue,
            goalVariance,
            deals: currentMonth.deals || []
        };
    }, [monthlyBreakdown, sellingDays, monthlyGoals]);

    const updateSellingDays = (monthKey, days) => {
        setSellingDays({...sellingDays, [monthKey]: parseInt(days) || 0});
    };

    const updateMonthlyGoal = (monthKey, goal) => {
        setMonthlyGoals({...monthlyGoals, [monthKey]: parseFloat(goal) || MONTHLY_THRESHOLD});
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatMonth = (monthKey) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const toggleYear = (year) => {
        setExpandedYears({...expandedYears, [year]: !expandedYears[year]});
    };

    const toggleMonth = (monthKey) => {
        setExpandedMonths({...expandedMonths, [monthKey]: !expandedMonths[monthKey]});
    };

    return (
        <div className="container">
            <div className="header">
                <a href="/logout" className="logout-btn">Logout</a>
                <div className="logo-text">rejig.ai</div>
                <h1>Commission Tracker</h1>
                <p className="subtitle">Monthly threshold: {formatCurrency(MONTHLY_THRESHOLD)} | Commission rate: 20%</p>
            </div>


            {lastSync && (
                <div className={`sync-status ${loading ? 'loading' : error ? 'error' : ''}`}>
                    <div className="sync-info">
                        {loading ? (
                            'Syncing with Google Sheets...'
                        ) : error ? (
                            `Sync error: ${error}. Using cached data.`
                        ) : (
                            `Last synced: ${new Date(lastSync).toLocaleString()} • ${deals.length} deals loaded`
                        )}
                    </div>
                    <button
                        className="refresh-btn"
                        onClick={fetchDealsFromSheet}
                        disabled={loading}
                    >
                        {loading ? 'Syncing...' : 'Refresh from Sheet'}
                    </button>
                </div>
            )}

            <div className="current-month-card">
                <div className="current-month-header">
                    <div className="current-month-title">
                        {formatMonth(currentMonthData.monthKey)}
                    </div>
                    <div className="controls-row">
                        <div className="control-group">
                            <label>Selling Days</label>
                            <input
                                type="number"
                                className="selling-days-input"
                                value={currentMonthData.totalSellingDays}
                                onChange={(e) => updateSellingDays(currentMonthData.monthKey, e.target.value)}
                                placeholder="20"
                                min="1"
                                max="31"
                            />
                        </div>
                        <div className="control-group">
                            <label>Monthly Goal</label>
                            <input
                                type="number"
                                className="selling-days-input"
                                value={currentMonthData.monthlyGoal}
                                onChange={(e) => updateMonthlyGoal(currentMonthData.monthKey, e.target.value)}
                                placeholder={MONTHLY_THRESHOLD.toString()}
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="metrics-grid">
                    <div className="metric">
                        <div className="metric-label">Revenue</div>
                        <div className="metric-value">{formatCurrency(currentMonthData.revenue)}</div>
                        <div className="metric-sub">{currentMonthData.deals.length} deals</div>
                    </div>

                    <div className="metric">
                        <div className="metric-label">Quota</div>
                        <div className="metric-value">{currentMonthData.quotaAttainment.toFixed(0)}%</div>
                        <div className="metric-sub">{currentMonthData.quotaVariance >= 0 ? '+' : ''}{formatCurrency(currentMonthData.quotaVariance)}</div>
                    </div>

                    <div className="metric">
                        <div className="metric-label">Goal</div>
                        <div className="metric-value">{currentMonthData.goalAttainment.toFixed(0)}%</div>
                        <div className="metric-sub">{currentMonthData.goalVariance >= 0 ? '+' : ''}{formatCurrency(currentMonthData.goalVariance)}</div>
                    </div>

                    <div className="metric">
                        <div className="metric-label">Commission</div>
                        <div className="metric-value">{formatCurrency(currentMonthData.commission)}</div>
                        <div className="metric-sub">{currentMonthData.daysProgress.toFixed(0)}% month done</div>
                    </div>
                </div>

                <div className="progress-section">
                    <div className="progress-label">
                        <span>Quota: {currentMonthData.quotaProgress.toFixed(0)}%</span>
                        <span>{formatCurrency(currentMonthData.revenue)} / {formatCurrency(MONTHLY_THRESHOLD)}</span>
                    </div>
                    <div className="progress-bar-container">
                        <div
                            className={`progress-bar ${
                                currentMonthData.quotaAttainment >= 100 ? 'ahead' :
                                currentMonthData.quotaAttainment >= 90 ? 'on-track' : 'behind'
                            }`}
                            style={{width: `${Math.min(currentMonthData.quotaProgress, 100)}%`}}
                        />
                    </div>

                    <div className="progress-label">
                        <span>Goal: {currentMonthData.goalProgress.toFixed(0)}%</span>
                        <span>{formatCurrency(currentMonthData.revenue)} / {formatCurrency(currentMonthData.monthlyGoal)}</span>
                    </div>
                    <div className="progress-bar-container">
                        <div
                            className={`progress-bar ${
                                currentMonthData.goalAttainment >= 100 ? 'ahead' :
                                currentMonthData.goalAttainment >= 90 ? 'on-track' : 'behind'
                            }`}
                            style={{width: `${Math.min(currentMonthData.goalProgress, 100)}%`}}
                        />
                    </div>
                </div>
            </div>

            <div className="summary-cards">
                <div className="card">
                    <div className="card-label">Total Closed Won</div>
                    <div className="card-value">{deals.length}</div>
                </div>
                <div className="card success">
                    <div className="card-label">Total Commission Earned</div>
                    <div className="card-value">{formatCurrency(totalCommission)}</div>
                </div>
            </div>

            <button className="section-toggle" onClick={() => setShowAddDeal(!showAddDeal)}>
                {showAddDeal ? '− Hide' : '+ Add'} New Deal
            </button>

            {showAddDeal && (
                <div className="collapsible-section">
                    <div className="add-deal-form">
                        <h2 style={{marginBottom: '15px', fontSize: '18px'}}>Add New Deal</h2>
                <div className="form-row">
                    <div className="form-group">
                        <label>Customer Name</label>
                        <input
                            type="text"
                            value={newDeal.name}
                            onChange={(e) => setNewDeal({...newDeal, name: e.target.value})}
                            placeholder="John Smith"
                        />
                    </div>
                    <div className="form-group">
                        <label>Close Date</label>
                        <input
                            type="date"
                            value={newDeal.close}
                            onChange={(e) => setNewDeal({...newDeal, close: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Subscription Amount</label>
                        <input
                            type="number"
                            value={newDeal.subscription}
                            onChange={(e) => setNewDeal({...newDeal, subscription: e.target.value})}
                            placeholder="600"
                        />
                    </div>
                    <div className="form-group">
                        <label>Setup Fee</label>
                        <input
                            type="number"
                            value={newDeal.setup}
                            onChange={(e) => setNewDeal({...newDeal, setup: e.target.value})}
                            placeholder="100"
                        />
                    </div>
                    <div className="form-group">
                        <label>Billing Cycle</label>
                        <select
                            value={newDeal.cycle}
                            onChange={(e) => setNewDeal({...newDeal, cycle: e.target.value})}
                        >
                            <option value="monthly">Monthly</option>
                            <option value="three-month">3 Months</option>
                            <option value="six-month">6 Months</option>
                            <option value="yearly">Yearly</option>
                            <option value="two-year">2 Years</option>
                        </select>
                    </div>
                </div>
                <button className="add-btn" onClick={addNewDeal}>Add Deal</button>
                    </div>
                </div>
            )}

            <button className="section-toggle" onClick={() => setShowDeals(!showDeals)}>
                {showDeals ? '− Hide' : '👁 View'} All Deals ({deals.length})
            </button>

            {showDeals && (
                <div className="collapsible-section">
                    <div className="deals-section">
                        {deals.map(deal => (
                    <div key={deal.id} className={`deal-item ${deal.churnDate ? 'churned' : ''}`}>
                        <div>
                            <div className="deal-name">{deal.name}</div>
                            <div className="deal-meta">
                                Closed {new Date(deal.close).toLocaleDateString()} • {deal.cycle}
                            </div>
                        </div>
                        <div>{formatCurrency(deal.subscription)} subscription</div>
                        <div>{formatCurrency(deal.setup)} setup</div>
                        <div>
                            {deal.churnDate ? (
                                <span style={{color: '#f15d55', fontSize: '13px'}}>
                                    Churned {new Date(deal.churnDate).toLocaleDateString()}
                                </span>
                            ) : (
                                <span style={{color: '#05c68e', fontSize: '13px'}}>Active</span>
                            )}
                        </div>
                        <div>
                            {!deal.churnDate ? (
                                <input
                                    type="date"
                                    className="churn-input"
                                    onChange={(e) => e.target.value && setChurnDate(deal.id, e.target.value)}
                                />
                            ) : (
                                <button className="unchurn-btn" onClick={() => removeChurn(deal.id)}>
                                    Reactivate
                                </button>
                            )}
                        </div>
                    </div>
                        ))}
                    </div>
                </div>
            )}

            <button className="section-toggle" onClick={() => setShowBreakdown(!showBreakdown)}>
                {showBreakdown ? '− Hide' : '📊 View'} Commission Breakdown
            </button>

            {showBreakdown && (
                <div className="collapsible-section">
                    <div className="monthly-breakdown">
                {Object.keys(yearlyBreakdown).sort().reverse().map(year => (
                    <div key={year} className="year-section">
                        <div className="year-header" onClick={() => toggleYear(year)}>
                            <div className="year-title">
                                {year}
                                <span className={`expand-icon ${expandedYears[year] ? 'expanded' : ''}`}> ▼</span>
                            </div>
                            <div className="year-commission">
                                {formatCurrency(yearlyBreakdown[year].commission)} commission
                            </div>
                        </div>

                        {expandedYears[year] && Object.keys(yearlyBreakdown[year].months).sort().map(monthKey => {
                            const data = yearlyBreakdown[year].months[monthKey];
                            const percentOfThreshold = (data.revenue / MONTHLY_THRESHOLD) * 100;
                            const isExpanded = expandedMonths[monthKey];

                            return (
                                <div key={monthKey} className="month-card">
                                    <div onClick={() => toggleMonth(monthKey)}>
                                        <div className="month-header">
                                            <div className="month-title">
                                                {formatMonth(monthKey)}
                                                <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}> ▼</span>
                                            </div>
                                            <div className={`month-commission ${data.commission === 0 ? 'zero' : ''}`}>
                                                {data.commission > 0 ? formatCurrency(data.commission) : 'No commission'}
                                            </div>
                                        </div>

                                        <div className="revenue-bar">
                                            <div
                                                className={`revenue-fill ${data.revenue <= MONTHLY_THRESHOLD ? 'under-threshold' : ''}`}
                                                style={{width: `${Math.min(percentOfThreshold, 100)}%`}}
                                            />
                                        </div>

                                        <div className="month-details">
                                            Total Revenue: {formatCurrency(data.revenue)}
                                            {data.revenue > MONTHLY_THRESHOLD ?
                                                ` (${formatCurrency(data.overThreshold)} over threshold)` :
                                                ` (${formatCurrency(MONTHLY_THRESHOLD - data.revenue)} under threshold)`
                                            }
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="deal-breakdown">
                                            {data.deals.map((d, i) => (
                                                <div key={i} className="deal-breakdown-item">
                                                    <span>{d.name} ({d.type})</span>
                                                    <span>{formatCurrency(d.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
                    </div>
                </div>
            )}
        </div>
    );
};

ReactDOM.render(<CommissionTracker />, document.getElementById('root'));
