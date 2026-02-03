
import React from 'react';

interface RulesProps {
    setView: (view: 'menu' | 'rules' | 'game' | 'online_menu') => void;
}

const Rules: React.FC<RulesProps> = ({ setView }) => {
    return (
        <div className="flex flex-col h-screen w-full max-w-md bg-[#042614] text-slate-200 overflow-hidden relative">
            <div className="p-6 pb-2 border-b border-white/10 shrink-0 bg-[#042614] z-10">
                <h2 className="text-3xl font-cinzel text-amber-500 font-bold tracking-widest">Regolamento</h2>
                <button onClick={() => setView('menu')} className="mt-4 w-full py-2 bg-amber-600 rounded font-bold uppercase">Torna al Menu</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <section>
                    <h3 className="text-amber-500 font-bold uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Obiettivo</h3>
                    <p className="text-sm leading-relaxed text-slate-300">
                        Il gioco si svolge in 3 giocatori. È una sfida tutti contro tutti con ruoli nascosti.
                        <br /><br />
                        <strong className="text-white">JOKER:</strong> Gioca da solo. Vince se totalizza almeno <strong className="text-amber-400">51 punti</strong>.
                        <br />
                        <strong className="text-white">ALLEATI:</strong> Giocano in coppia. Vincono se totalizzano insieme almeno <strong className="text-blue-400">71 punti</strong>.
                    </p>
                </section>

                <section>
                    <h3 className="text-amber-500 font-bold uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Ruoli</h3>
                    <p className="text-sm leading-relaxed text-slate-300">
                        A inizio partita viene estratta una <strong className="text-amber-400">Briscola</strong> visibile a tutti.
                        <br /><br />
                        Il <strong className="text-amber-500">JOKER</strong> è colui che gioca per primo una carta del seme di Briscola. Fino a quel momento, i ruoli sono segreti!
                        <br />
                        Gli altri due giocatori sono gli <strong className="text-blue-400">ALLEATI</strong> e devono collaborare per impedire al Joker di fare punti, ma senza sapere chi è il compagno all'inizio.
                    </p>
                </section>

                <section>
                    <h3 className="text-amber-500 font-bold uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Valore Carte</h3>
                    <ul className="text-sm space-y-2 text-slate-300">
                        <li className="flex justify-between border-b border-white/5 pb-1"><span>Asso (1)</span> <span className="font-bold text-white">11 punti</span></li>
                        <li className="flex justify-between border-b border-white/5 pb-1"><span>Tre (3)</span> <span className="font-bold text-white">10 punti</span></li>
                        <li className="flex justify-between border-b border-white/5 pb-1"><span>Re (10)</span> <span className="font-bold text-white">4 punti</span></li>
                        <li className="flex justify-between border-b border-white/5 pb-1"><span>Cavallo (9)</span> <span className="font-bold text-white">3 punti</span></li>
                        <li className="flex justify-between border-b border-white/5 pb-1"><span>Fante (8)</span> <span className="font-bold text-white">2 punti</span></li>
                        <li className="flex justify-between"><span>Scartine (2, 4, 5, 6, 7)</span> <span className="font-bold text-white/50">0 punti</span></li>
                    </ul>
                </section>

                <section>
                    <h3 className="text-amber-500 font-bold uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Svolgimento</h3>
                    <div className="text-sm leading-relaxed text-slate-300">
                        Si distribuiscono 39 carte, 13 a testa (l'ultima è la Briscola in tavola).
                        A turno, ogni giocatore cala una carta.
                        <br />
                        Regole di presa classiche della Briscola:
                        <ul className="list-disc list-inside mt-2 pl-2 space-y-1 text-xs text-slate-400">
                            <li>Vince la carta di Briscola più alta.</li>
                            <li>Se non c'è Briscola, vince la carta del seme di uscita più alta.</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Rules;
