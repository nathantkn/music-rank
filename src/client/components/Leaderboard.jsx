import '../styles/Leaderboard.css';

const BOARD_ROWS = 20;

/** Durations render as m:ss — never raw milliseconds. */
export function formatValue(value, format) {
    if (format !== 'duration') return value;
    const ms = Number(value);
    if (!Number.isFinite(ms)) return value;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function Leaderboard({ rows, unit, format, loading }) {
    if (loading) {
        return <div className="board-body board-muted board-loading">Loading…</div>;
    }

    if (!rows || rows.length === 0) {
        return <div className="board-body board-muted board-loading">Nothing on this board yet.</div>;
    }

    return (
        <div className="board-body">
            <div className="board-grid board-row-head">
                <div>Pos</div>
                <div>Name</div>
                <div>{unit}</div>
            </div>

            {rows.slice(0, BOARD_ROWS).map((row, i) => (
                <div key={row.subjectId ?? `${row.subjectName}-${i}`} className="board-grid board-row">
                    <span className={`board-pos ${i === 0 ? 'is-first' : ''}`}>{i + 1}</span>
                    <div className="board-name">
                        <div className="board-art art-tile">
                            {row.subjectImage && (
                                <img
                                    src={row.subjectImage}
                                    alt=""
                                    loading="lazy"
                                    onError={e => { e.currentTarget.style.display = 'none' }}
                                />
                            )}
                        </div>
                        <span className="board-name-text">{row.subjectName}</span>
                    </div>
                    <span className="board-value">{formatValue(row.value, format)}</span>
                </div>
            ))}
        </div>
    );
}
