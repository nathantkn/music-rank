import { useEffect, useState } from 'react';
import Leaderboard from './Leaderboard.jsx';
import '../styles/LeaderboardPreview.css';

function LeaderboardPreview({ 
    metric, 
    title, 
    isExpanded, 
    onToggle,
    value,
}) {
    const [firstPlace, setFirstPlace] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFirstPlace() {
            setLoading(true);
            
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
            } finally {
                setLoading(false);
            }
        }
        
        fetchFirstPlace();
    }, [metric]);

    const handleToggle = () => {
        onToggle();
    }

    return (
        <div className={`preview-box ${isExpanded ? 'expanded' : ''}`} onClick={handleToggle}>
            <div className="preview-content">
                <div className="preview-left">
                    <h3 className="preview-title">{title}</h3>
                </div>
                
                <div className="preview-right">
                    {loading ? (
                        <div className="preview-loading">Loading...</div>
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
                    <Leaderboard metric={metric} title={title} value={value} />
                </div>
            )}
        </div>
    );
}

export default LeaderboardPreview;