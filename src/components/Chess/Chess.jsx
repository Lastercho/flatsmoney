import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import '../../styles/Chess.css';

const INITIAL_FEN = 'start';

// Helpers for shareable link encoding (no backend)
function b64urlEncode(str) {
    try {
        return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    } catch {
        return '';
    }
}
function b64urlDecode(str) {
    try {
        let s = (str || '').replace(/-/g, '+').replace(/_/g, '/');
        const pad = s.length % 4;
        if (pad) s += '='.repeat(4 - pad);
        return decodeURIComponent(escape(atob(s)));
    } catch {
        return '';
    }
}

const pieceUnicode = {
    p: '♟',
    r: '♜',
    n: '♞',
    b: '♝',
    q: '♛',
    k: '♚',
    P: '♙',
    R: '♖',
    N: '♘',
    B: '♗',
    Q: '♕',
    K: '♔',
};

// Bulgarian names for pieces (lowercase type letters)
const pieceBgName = {
    p: 'пешка',
    n: 'кон',
    b: 'офицер',
    r: 'топ',
    q: 'дама',
    k: 'цар',
};

function getUserId() {
    try {
        const u = JSON.parse(localStorage.getItem('user'));
        return u?.id || u?._id || null;
    } catch {
        return null;
    }
}

function storageKey() {
    const id = getUserId();
    return id ? `chess_state_${id}` : 'chess_state_guest';
}

function loadFen() {
    const saved = localStorage.getItem(storageKey());
    if (!saved) return null;
    try {
        const data = JSON.parse(saved);
        return data?.fen || null;
    } catch {
        return null;
    }
}

function saveFen(fen) {
    try {
        localStorage.setItem(storageKey(), JSON.stringify({ fen, savedAt: Date.now() }));
    } catch (e) {
        console.warn('Cannot save chess state:', e);
    }
}

function clearFen() {
    localStorage.removeItem(storageKey());
}

// Persist last move separately so it survives refresh on this device


const ChessBoard = () => {
    const shareParamKey = 'game';
    const navigate = useNavigate();
    const [chess, setChess] = useState(() => new Chess());
    const [selected, setSelected] = useState(null); // square like 'e2'
    const [legalMoves, setLegalMoves] = useState([]); // target squares
    const [turn, setTurn] = useState('w');
    const [statusText, setStatusText] = useState('');
    const [isGameOver, setIsGameOver] = useState(false);
    const [lastMove, setLastMove] = useState(null); // {from, to, san}
    const boardRef = useRef(null);

    // Build share URL from a fen and lastMove
    const buildShareUrl = (fen, lastMoveObj) => {
        const compact = lastMoveObj
            ? { from: lastMoveObj.from, to: lastMoveObj.to, san: lastMoveObj.san, captured: lastMoveObj.captured || null }
            : null;
        const payload = { fen, lastMove: compact, t: Date.now() };
        const encoded = b64urlEncode(JSON.stringify(payload));
        const url = new URL(window.location.href);
        url.searchParams.set(shareParamKey, encoded);
        return url.toString();
    };

    const [shareUrl, setShareUrl] = useState('');

    // Initialize from URL (?game=...) or persisted FEN if exists
    useEffect(() => {
        const game = new Chess();

        const url = new URL(window.location.href);
        const encoded = url.searchParams.get(shareParamKey);
        let fenFromUrl = null;
        let lastMoveFromUrl = null;
        if (encoded) {
            const decoded = b64urlDecode(encoded);
            try {
                const obj = JSON.parse(decoded);
                if (obj?.fen) fenFromUrl = obj.fen;
                if (obj?.lastMove) lastMoveFromUrl = obj.lastMove;
            } catch (e) {
                console.warn('Invalid game URL payload');
            }
        }

        const fenLocal = loadFen();
        const fen = fenFromUrl || fenLocal;

        try {
            if (fen && fen !== INITIAL_FEN) {
                game.load(fen);
            }
        } catch (e) {
            console.warn('Invalid saved chess FEN. Starting new game.');
        }

        setChess(game);
        setTurn(game.turn());
        updateStatus(game);

        // Initialize last move from URL payload (if provided)
        setLastMove(lastMoveFromUrl || null);

        // Persist and set share url on init
        saveFen(game.fen());
        setShareUrl(buildShareUrl(game.fen(), lastMoveFromUrl || null));

        // If URL had no param, ensure it reflects current state without adding history entry
        if (!encoded) {
            const newUrl = buildShareUrl(game.fen(), lastMoveFromUrl || null);
            window.history.replaceState({}, '', newUrl);
        }
    }, []);

    const board = useMemo(() => chess.board(), [chess, turn]);

    const updateStatus = (gameInstance) => {
        const mate = gameInstance.isCheckmate();
        const draw = gameInstance.isDraw();
        setIsGameOver(mate || draw);

        if (mate) {
            setStatusText(`Шах-мат! ${gameInstance.turn() === 'w' ? 'Черните' : 'Белите'} печелят.`);
        } else if (draw) {
            setStatusText('Равенство.');
        } else if (gameInstance.isCheck()) {
            setStatusText(`${gameInstance.turn() === 'w' ? 'Бели' : 'Черни'} са на ход — Шах!`);
        } else {
            setStatusText(`${gameInstance.turn() === 'w' ? 'Бели' : 'Черни'} са на ход.`);
        }
    };

    const onSquareClick = (fileIndex, rankIndex) => {
        // chess.board() returns 8x8 from rank 8 to 1; ranks index 0 is 8th rank
        const file = 'abcdefgh'[fileIndex];
        const rank = 8 - rankIndex; // convert index to rank number
        const sq = `${file}${rank}`;

        if (!selected) {
            // select if there is a piece of the current turn
            const piece = chess.get(sq);
            if (piece && piece.color === chess.turn()) {
                const moves = chess.moves({ square: sq, verbose: true });
                setSelected(sq);
                // Compute destinations and augment with rook squares for castling when selecting the king
                let dests = moves.map((m) => m.to);
                try {
                    if (piece.type === 'k') {
                        const hasK = moves.some((m) => m.flags && m.flags.includes('k'));
                        const hasQ = moves.some((m) => m.flags && m.flags.includes('q'));
                        if (piece.color === 'w') {
                            if (hasK) dests = Array.from(new Set([...dests, 'h1']));
                            if (hasQ) dests = Array.from(new Set([...dests, 'a1']));
                        } else {
                            if (hasK) dests = Array.from(new Set([...dests, 'h8']));
                            if (hasQ) dests = Array.from(new Set([...dests, 'a8']));
                        }
                    }
                } catch {}
                setLegalMoves(dests);
            } else {
                setSelected(null);
                setLegalMoves([]);
            }
            return;
        }

        if (selected === sq) {
            // deselect
            setSelected(null);
            setLegalMoves([]);
            return;
        }

        // Try to make a move (supporting castling by allowing rook-click when king is selected)
        let attemptedTo = sq;
        try {
            const selPiece = chess.get(selected);
            const dstPiece = chess.get(sq);
            if (selPiece && selPiece.type === 'k' && dstPiece && dstPiece.color === selPiece.color && dstPiece.type === 'r') {
                // If the king is selected and the user clicks their rook, map to the king's castling destination square
                if (selPiece.color === 'w') {
                    if (sq === 'h1') attemptedTo = 'g1';
                    if (sq === 'a1') attemptedTo = 'c1';
                } else {
                    if (sq === 'h8') attemptedTo = 'g8';
                    if (sq === 'a8') attemptedTo = 'c8';
                }
            }
        } catch {}
        const move = chess.move({ from: selected, to: attemptedTo, promotion: 'q' });
        if (move) {
            // successful move
            setSelected(null);
            setLegalMoves([]);
            setTurn(chess.turn());
            const lm = { from: move.from, to: move.to, san: move.san, captured: move.captured || null };
            setLastMove(lm);
            const fenNow = chess.fen();
            saveFen(fenNow);
            setShareUrl(buildShareUrl(fenNow, lm));
            // Update URL without adding history entries
            window.history.replaceState({}, '', buildShareUrl(fenNow, lm));
            updateStatus(chess);
        } else {
            // invalid destination; maybe select new piece
            const piece = chess.get(sq);
            if (piece && piece.color === chess.turn()) {
                const moves = chess.moves({ square: sq, verbose: true });
                setSelected(sq);
                // Compute destinations and augment with rook squares for castling when selecting the king
                let dests = moves.map((m) => m.to);
                try {
                    if (piece.type === 'k') {
                        const hasK = moves.some((m) => m.flags && m.flags.includes('k'));
                        const hasQ = moves.some((m) => m.flags && m.flags.includes('q'));
                        if (piece.color === 'w') {
                            if (hasK) dests = Array.from(new Set([...dests, 'h1']));
                            if (hasQ) dests = Array.from(new Set([...dests, 'a1']));
                        } else {
                            if (hasK) dests = Array.from(new Set([...dests, 'h8']));
                            if (hasQ) dests = Array.from(new Set([...dests, 'a8']));
                        }
                    }
                } catch {}
                setLegalMoves(dests);
            } else {
                setSelected(null);
                setLegalMoves([]);
            }
        }
    };

    const handleReset = () => {
        const confirmReset = window.confirm('Сигурни ли сте, че искате да рестартирате играта?');
        if (!confirmReset) return;
        const fresh = new Chess();
        setChess(fresh);
        setTurn(fresh.turn());
        setSelected(null);
        setLegalMoves([]);
        setLastMove(null);
        clearFen();
        updateStatus(fresh);
        // Clear URL param
        const url = new URL(window.location.href);
        url.searchParams.delete(shareParamKey);
        const withParam = buildShareUrl(fresh.fen(), null);
        setShareUrl(withParam);
        window.history.replaceState({}, '', withParam);
    };

    const handleUndo = () => {
        const undone = chess.undo();
        if (!undone) return;
        setSelected(null);
        setLegalMoves([]);
        setTurn(chess.turn());
        // Determine new last move (the one before the undone one)
        const hist = chess.history({ verbose: true });
        let currentLastMove = null;
        if (hist.length > 0) {
            const prev = hist[hist.length - 1];
            const lm = { from: prev.from, to: prev.to, san: prev.san, captured: prev.captured || null };
            setLastMove(lm);
            currentLastMove = lm;
        } else {
            setLastMove(null);
        }
        const fenNow = chess.fen();
        saveFen(fenNow);
        setShareUrl(buildShareUrl(fenNow, currentLastMove));
        window.history.replaceState({}, '', buildShareUrl(fenNow, currentLastMove));
        updateStatus(chess);
    };

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            alert('Линкът е копиран в клипборда!');
        } catch (e) {
            // Fallback
            try {
                const temp = document.createElement('textarea');
                temp.value = shareUrl;
                document.body.appendChild(temp);
                temp.select();
                document.execCommand('copy');
                document.body.removeChild(temp);
                alert('Линкът е копиран в клипборда!');
            } catch {
                alert('Копирането не бе успешно. Моля, копирайте ръчно.');
            }
        }
    };

    const handleBack = () => navigate('/home');

    return (
        <div className="chess-page">
            <div className="chess-header">
                <h2>Шах</h2>
                <div className="chess-actions">
                    <button className="btn-secondary" onClick={handleBack}>← Назад</button>
                    <button className="btn-secondary" onClick={handleUndo} disabled={chess.history().length === 0} title="Отмени последния ход">↶ Отмени ход</button>
                    <button className="btn-danger" onClick={handleReset}>Рестартирай</button>
                </div>
            </div>

            <div className="chess-container">
                <div className="board" ref={boardRef}>
                    {board.map((rank, rankIndex) => (
                        <div className="rank" key={rankIndex}>
                            {rank.map((square, fileIndex) => {
                                const isDark = (rankIndex + fileIndex) % 2 === 1;
                                const file = 'abcdefgh'[fileIndex];
                                const rankNum = 8 - rankIndex;
                                const sq = `${file}${rankNum}`;
                                const isSelected = selected === sq;
                                const isLegal = legalMoves.includes(sq);
                                return (
                                    <div
                                        key={fileIndex}
                                        className={`square ${isDark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''} ${isLegal ? 'legal' : ''} ${lastMove && (lastMove.from === sq || lastMove.to === sq) ? 'last-move' : ''}`}
                                        onClick={() => onSquareClick(fileIndex, rankIndex)}
                                    >
                                        {square && (
                                            <span className={`piece ${square.color === 'w' ? 'white' : 'black'}`}>
                        {pieceUnicode[square.type === square.type.toLowerCase() ? square.type : square.type] || pieceUnicode[square.type] || ''}
                      </span>
                                        )}
                                        {/* Coordinates labels */}
                                        {fileIndex === 0 && (
                                            <div className="coord rank-label">{rankNum}</div>
                                        )}
                                        {rankIndex === 7 && (
                                            <div className="coord file-label">{'abcdefgh'[fileIndex]}</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div className="side-panel">
                    <div className="status-card">
                        <h3>Статус</h3>
                        <p>{statusText}</p>
                        {isGameOver && (
                            <p className="game-over">Играта е приключила.</p>
                        )}
                    </div>

                    <div className="status-card">
                        <h3>Последен ход</h3>
                        {lastMove ? (
                            <>
                                <p><strong>{lastMove.san}</strong> ({lastMove.from}→{lastMove.to})</p>
                                {lastMove.captured ? (
                                    <p>
                                        Взета фигура: {pieceBgName[lastMove.captured] || lastMove.captured}
                                        {pieceUnicode[lastMove.captured] ? ` (${pieceUnicode[lastMove.captured]})` : ''}
                                    </p>
                                ) : null}
                            </>
                        ) : (
                            <p>Все още няма ход.</p>
                        )}
                    </div>
                    <div className="status-card">
                        <h3>Изпрати партията шах на опонента</h3>
                        <p>Използвайте тази създадена връзка, за да изпратите хода си на другия играч. </p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                onFocus={(e) => e.target.select()}
                                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                            <button className="btn-secondary" onClick={copyShareLink} title="Копирай линка">Копирай</button>
                        </div>
                        <small>Линкът се обновява автоматично след всеки ход.</small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChessBoard;
