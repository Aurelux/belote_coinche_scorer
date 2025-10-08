import React from "react";
import { ArrowLeft } from "lucide-react";
import { useGame } from '../context/GameContext';

export default function HelpBelote2j() {
  const {goBack} = useGame();

  return (
<div className="min-h-screen pt-safe pb-safe flex items-center justify-center p-4"
     style={{
       backgroundColor: '#0b3d0b', // vert très foncé
       backgroundImage: `
         radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px),
         radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)
       `,
       backgroundPosition: '0 0, 10px 10px',
       backgroundSize: '20px 20px'
     }}
>      <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 flex flex-col">

        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={goBack}
            className="p-2 text-green-700 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center text-2xl font-bold text-green-800">
            Belote — 2 Joueurs
          </h1>
          <div className="w-8" />
        </div>

        {/* Contenu */}
        <section className="space-y-4 text-gray-800">
          <p>
            La <strong>Belote à 2 joueurs</strong> est une version adaptée du jeu classique. Chaque joueur joue pour soi, mais les règles générales de la Belote restent les mêmes.
          </p>

          <h2 className="text-xl font-semibold text-green-600 mt-4">🎯 Mise en place & distribution</h2>
          <ol className="list-decimal pl-6 space-y-1">
            <li>On utilise un jeu complet de 32 cartes (7 → As).</li>
            <li>Distribution : 2 paquets de 5 cartes et 2 paquets de 6 cartes.</li>
            <li>Chaque joueur prend un paquet de 6 cartes, retourne 3 cartes du paquet choisi au-dessus de ses 3 cartes face cachée, puis prend le paquet de 5 cartes.</li>
            <li>Les cartes restantes sont placées face visible sur la table pour information.</li>
          </ol>

          <h2 className="text-xl font-semibold text-green-600 mt-4">🃏 Déroulement du jeu</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Le joueur qui commence mène la première levée.</li>
            <li>Obligation de suivre la couleur demandée ; sinon, jouer un atout si disponible.</li>
            <li>Le plus fort atout remporte le pli. Si aucun atout, la carte la plus haute de la couleur demandée gagne.</li>
            <li>Belote-Rebelote : Roi + Dame d’atout → annonce et +20 pts.</li>
          </ul>

          <h2 className="text-xl font-semibold text-green-600 mt-4">📊 Valeurs des cartes</h2>
          <h3 className="font-semibold mt-2">➡️ Atout</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Valet : 20 pts</li>
            <li>9 : 14 pts</li>
            <li>As : 11 pts</li>
            <li>10 : 10 pts</li>
            <li>Roi : 4 pts</li>
            <li>Dame : 3 pts</li>
            <li>8, 7 : 0 pts</li>
          </ul>

          <h3 className="font-semibold mt-2">➡️ Non-atout</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>As : 11 pts</li>
            <li>10 : 10 pts</li>
            <li>Roi : 4 pts</li>
            <li>Dame : 3 pts</li>
            <li>Valet : 2 pts</li>
            <li>9, 8, 7 : 0 pts</li>
          </ul>

          <h2 className="text-xl font-semibold text-green-600 mt-4">💯 Calcul des points & victoire</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Total des plis : 162 points + 10 pour la dernière levée.</li>
            <li>Belote-Rebelote : 20 pts.</li>
            <li>Le joueur qui commence doit atteindre le contrat avec ses points + Belote/Rebelote.</li>
            <li>Si réussite : le joueur marque ses points, sinon l’adversaire marque tout.</li>
            <li>Coinche/Surcoinche : optionnel, points doublés ou quadruplés.</li>
          </ul>

          <h2 className="text-xl font-semibold text-green-600 mt-4">🏆 Objectif</h2>
          <p>
            Chaque joueur joue pour soi. La partie se joue généralement en <strong>1000 points</strong>. Le premier à atteindre ce score gagne 🎉.
          </p>

          <h2 className="text-xl font-semibold text-green-600 mt-4">📝 Conseils pratiques</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Observez les cartes visibles pour deviner les forces de votre adversaire.</li>
            <li>Planifiez vos plis selon les cartes visibles et vos cartes cachées.</li>
            <li>Annoncez Belote-Rebelote systématiquement si vous détenez Roi + Dame d’atout.</li>
          </ul>

          <div className="mt-6 p-3 bg-green-50 rounded-md border">
            <h3 className="font-semibold">Fiche rapide</h3>
            <ul className="pl-6 list-disc mt-2">
              <li>Deck : 32 cartes.</li>
              <li>Distribution : 2 paquets de 5 + 2 paquets de 6 → révéler 3 cartes du paquet choisi.</li>
              <li>Belote-Rebelote : 20 pts.</li>
              <li>Coinche/Surcoinche : optionnel ×2 ou ×4.</li>
              <li>Victoire : premier à 1000 points ou à réussir ses plis + Belote/Rebelote.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
