import React, { useMemo } from 'react';
import { useAppState } from './BudgetContext';
import { generateInsights } from './insightsEngine';

const FinancialInsightsPanel: React.FC = () => {
  const { income, config, expenses } = useAppState();

  const insights = useMemo(
    () => generateInsights({ income, config, expenses }),
    [income, config, expenses]
  );

  return (
    <div className="card card-wide">
      <div className="card-header">
        <h2>Financial Wisdom</h2>
        <p className="card-meta">Rule-based and trend-based outlook - Current month</p>
      </div>
      <div className="insights-grid">
        {insights.map((insight) => (
          <div key={insight.id} className={`insight-card insight-${insight.tone}`}>
            <h3>{insight.title}</h3>
            <p>{insight.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialInsightsPanel;
