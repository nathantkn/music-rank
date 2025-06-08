import React, { useEffect, useState } from 'react';

function LeaderboardPreview({ 
  metric, 
  title, 
  description, 
  isExpanded, 
  onToggle,
  LeaderboardComponent 
}) {
  const [firstPlace, setFirstPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFirstPlace() {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/leaderboards/${metric}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setFirstPlace(data && data.length > 0 ? data[0] : null);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFirstPlace();
  }, [metric]);

  const handleClick = () => {
    onToggle();
  };

  return (
    <div className={`preview-box ${isExpanded ? 'expanded' : ''}`} onClick={handleClick}>
      <div className="preview-content">
        <div className="preview-left">
          <h3 className="preview-title">{title}</h3>
          <p className="preview-description">{description}</p>
        </div>
        
        <div className="preview-right">
          {loading ? (
            <div className="preview-loading">Loading...</div>
          ) : error ? (
            <div className="preview-error">Error loading data</div>
          ) : firstPlace ? (
            <>
              <div className="preview-winner">
                <span className="winner-name">{firstPlace.subjectName}</span>
              </div>
              <div className="winner-value">{firstPlace.value}</div>
            </>
          ) : (
            <div className="preview-loading">No data</div>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="expanded-content">
          <LeaderboardComponent metric={metric} title={title} />
        </div>
      )}
    </div>
  );
}

export default LeaderboardPreview;