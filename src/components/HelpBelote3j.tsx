import React from "react";
import { ArrowLeft } from "lucide-react";
import {  useGame } from '../context/useGame';

export default function HelpBelote3j() {
  const { navigateTo, goBack} = useGame();

  return (
<div className="min-h-screen pt-safe pb-safe flex items-center justify-center p-4"

     style={{

       backgroundColor: '#042204', // vert très foncé

       backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px),
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,

       backgroundPosition: '0 0, 10px 10px',

       backgroundSize: '20px 20px'

     }}

>   <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative left-1/2 transform -translate-x-1/2" style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}>

        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={goBack}
            className="p-2 text-green-700 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center text-2xl font-bold text-green-800">
            Belote — 3 Joueurs
          </h1>
          <div className="w-8" />
        </div>

        {/* Contenu */}
        <section className="space-y-4 text-gray-800">
          <p>
            La <strong>Belote à 3 joueurs</strong> reprend le principe de la Belote classique mais adaptée pour trois joueurs solo. Chacun joue pour soi, et la victoire dépend des points obtenus par rapport aux deux autres.
          </p>

          <h2 className="text-xl font-semibold text-green-600 mt-4">🎯 Mise en place & distribution</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Retirer les cartes <strong>7 et 8</strong> → reste 24 cartes.</li>
            <li>Distribution : chaque joueur reçoit <strong>8 cartes</strong> en paquets de 3-2-3, 2-3-3 ou 3-3-2.</li>
            <li>Les cartes visibles servent d'information pour choisir la couleur d’atout.</li>
          </ul>

          <h2 className="text-xl font-semibold text-green-600 mt-4">🃏 Déroulement du jeu</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Le preneur mène la première levée.</li>
            <li>Obligation de suivre la couleur demandée ; sinon, jouer un atout si disponible.</li>
            <li>Le joueur qui pose la plus forte carte d’atout ou la plus haute carte de la couleur demandée remporte le pli.</li>
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

          <h2 className="text-xl font-semibold text-green-600 mt-4">💯 Calcul des points & victoire</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Chaque joueur compte ses points à la fin de la manche (plis + Belote/Rebelote).</li>
            <li>Victoire : le joueur ayant le plus de points gagne (plus que les deux autres).</li>
            <li>Exemple : Joueur A = 18 pts, Joueur B = 64 pts, Joueur C = 80 pts → Joueur C gagne.</li>
            <li>Belote-Rebelote : 20 pts si présent.</li>
          </ul>

          <h2 className="text-xl font-semibold text-green-600 mt-4">📝 Conseils pratiques</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Planifiez vos plis et votre stratégie selon les cartes probables des autres joueurs.</li>
            <li>Les petites peuevnt cartes servent à contrôler le jeu.</li>
          </ul>

          <div className="mt-6 p-3 bg-green-50 rounded-md border">
            <h3 className="font-semibold">Fiche rapide</h3>
            <ul className="pl-6 list-disc mt-2">
              <li>Deck : 24 cartes (sans 7 et 8).</li>
              <li>Distribution : paquets 3-2-3 / 2-3-3 / 3-3-2.</li>
              <li>Choix de l’atout : preneur annonce la couleur.</li>
              <li>Belote-Rebelote : 20 pts.</li>
              <li>Victoire : plus de points que le maximum des deux autres joueurs.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
