import React from "react";
import { ArrowLeft } from "lucide-react";
import { useGame } from '../context/GameContext';

export default function HelpBelote4j() {
  const { navigateTo, goBack } = useGame();

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
            Belote — 4 Joueurs
          </h1>
          <div className="w-8" /> {/* placeholder pour équilibrer le header */}
        </div>

        {/* Contenu */}
        <section className="space-y-4 text-gray-800">
          <p>
            La <strong>Belote classique à 4 joueurs</strong> se joue en équipes de 2. Chaque joueur joue pour son équipe, et la victoire dépend du total des points d’équipe.
          </p>

          <h2 className="text-xl font-semibold text-green-600 mt-4">🎯 Mise en place & distribution</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Jeu complet de 32 cartes (7 → As).</li>
            <li>Équipes : joueur 1 & 3 contre joueur 2 & 4.</li>
            <li>Distribution : 5 cartes, puis 3 cartes supplémentaires par joueur (2 tours : 5+3).</li>
            <li>Cartes restantes : talon pour choix de l’atout.</li>
          </ul>

          <h2 className="text-xl font-semibold text-green-600 mt-4">📢 Choix de couleur</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Une carte du talon est retournée pour proposer une couleur d’atout.</li>
            <li>Chaque joueur peut « prendre » la couleur ou passer, dans l’ordre.</li>
            <li>Si personne ne prend, un deuxième tour est proposé avec possibilité de choisir une autre couleur.</li>
            <li>Le joueur qui prend devient le preneur et détermine l’atout.</li>
            <li>L’équipe du preneur joue contre l’équipe adverse.</li>
          </ul>

          <h2 className="text-xl font-semibold text-green-600 mt-4">🃏 Déroulement du jeu</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Le preneur mène la première levée.</li>
            <li>Obligation de suivre la couleur demandée. Si impossible, jouer un atout si disponible.</li>
            <li>Le plus fort atout remporte le pli ; sinon, la carte la plus haute de la couleur demandée remporte le pli.</li>
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
          </ul>

          <h3 className="font-semibold mt-2">➡️ Non-atout</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>As : 11 pts</li>
            <li>10 : 10 pts</li>
            <li>Roi : 4 pts</li>
            <li>Dame : 3 pts</li>
            <li>Valet : 2 pts</li>
          </ul>

          <h3 className="font-semibold mt-2">➡️ Tout Atout / Sans Atout</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Tout Atout : Valet 20, 9 14, As 11, 10 10, Roi 4, Dame 3, Belote-Rebelote = 20 pts.</li>
            <li>Sans Atout : As 19, 10 10, Roi 4, Dame 3, Valet 2, pas de Belote-Rebelote.</li>
          </ul>

          <h2 className="text-xl font-semibold text-green-600 mt-4">💯 Calcul des points & victoire</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Total par manche : 162 pts (cartes) + 10 pour la dernière levée.</li>
            <li>Belote-Rebelote : 20 pts.</li>
            <li>Équipe du preneur doit atteindre le contrat annoncé (points cumulés de l’équipe + Belote/Rebelote).</li>
            <li>Contrat réussi → équipe preneur marque ses points ; sinon, équipe adverse marque tout.</li>
          </ul>

          <h2 className="text-xl font-semibold text-green-600 mt-4">📌 Exemples concrets</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Ex. 1 : équipe A annonce 100 atout Cœur → finit avec 110 pts (plis + Belote) → contrat réussi → équipe A marque 110 pts.</li>
            <li>Ex. 2 : équipe B annonce 120 → obtient seulement 110 → contrat raté → équipe A marque 120 pts.</li>
            <li>Belote-Rebelote réussie : +20 pts au total.</li>
          </ul>

          <h2 className="text-xl font-semibold text-green-600 mt-4">📝 Conseils pratiques</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Observez attentivement les plis adverses pour estimer les cartes restantes.</li>
            <li>Annoncez la Belote-Rebelote systématiquement pour maximiser les points.</li>
            <li>Communiquez subtilement avec votre coéquipier via les plis.</li>
            <li>Gardez en tête les cartes visibles et jouées pour optimiser les prises et sécuriser le contrat.</li>
          </ul>

          <div className="mt-6 p-3 bg-green-50 rounded-md border">
            <h3 className="font-semibold">Fiche rapide</h3>
            <ul className="pl-6 list-disc mt-2">
              <li>Deck : 32 cartes.</li>
              <li>Distribution : 5 + 3 cartes par joueur.</li>
              <li>Contrat minimum : 80 pts.</li>
              <li>Belote-Rebelote : 20 pts.</li>
              <li>Victoire : équipe preneuse réussit contrat → marque ses points ; sinon, équipe adverse marque tout.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
