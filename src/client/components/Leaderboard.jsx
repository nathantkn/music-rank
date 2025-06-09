import { useEffect, useState } from 'react';
import '../styles/Leaderboard.css';

export default function Leaderboard({ metric, title, value }) {
    const [rows, setRows] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);

            try {
                const res = await fetch(`/api/leaderboards/${metric}`);
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || `HTTP ${res.status}`);
                }
                const data = await res.json();
                setRows(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        
        fetchData();
    }, [metric]);

    if (loading) {
        return (
            <div className="leaderboard-container">
                <h2 className="leaderboard-header">{title}</h2>
                <div className="leaderboard-loading">
                    <div className="loading-spinner"></div>
                    Loading {title}...
                </div>
            </div>
        );
    }

    return (
        <div className="leaderboard-container">
            <table className="leaderboard-table">
                <thead>
                    <tr>
                        <th className="rank-header">POS.</th>
                        <th className="name-header">Name</th>
                        <th className="value-header">{value}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows && rows.map((row, i) => (
                        <tr key={row.subjectId}>
                            <td className="rank-cell">{i + 1}</td>
                            <td className="name-cell">{row.subjectName}</td>
                            <td className="value-cell">{row.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}