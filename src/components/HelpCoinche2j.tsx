import React from "react";
import { ArrowLeft } from "lucide-react";
import {  useGame } from '../context/useGame';

export default function HelpCoinche2j() {
  const { navigateTo, goBack } = useGame();

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
            Coinche — 2 Joueurs
          </h1>
          <div className="w-8" /> {/* placeholder pour équilibrer le header */}
        </div>

        {/* Contenu */}
        <section className="space-y-4 text-gray-800">
          <p>
            Variante 2 joueurs — fun, stratégique et un peu aléatoire. On joue avec le jeu complet (32 cartes).  
            Chaque joueur choisit deux paquets : le premier paquet révèle 4 cartes visibles qui influenceront les enchères.
          </p>

          <h2 className="text-xl font-semibold text-green-600 mt-4">🎯 Mise en place & distribution</h2>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Mélange le jeu complet de 32 cartes (7→As).</li>
            <li>Distribue 4 paquets de 8 cartes face-basse au centre.</li>
            <li>Chaque joueur choisit 2 paquets :
              <ul className="list-disc pl-6 mt-1">
                <li>Premier paquet : 4 cartes visibles au-dessus de 4 cartes face cachées</li>
                <li>Deuxième paquet : toutes les cartes dans notre main (jeu normal).</li>
              </ul>
            </li>
            <li>Les 4 cartes visibles de chaque joueur restent visibles pendant l’enchère et servent d’indice.</li>
          </ol>

          <h2 className="text-xl font-semibold text-green-600 mt-4">📢 Enchères</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Contrat minimum : 80 points (puis 90, 100 … jusqu’à 180 ou général).</li>
            <li>Le preneur annonce points + couleur d’atout, ou Tout Atout / Sans Atout.</li>
            <li>Les enchères tiennent compte des cartes visibles de chacun.</li>
            <li>Coinche = parier sur le fait qeu l'adversaire rate son pari et cela double les points, Surcoinche = triple.</li>
          </ul>

          <h2 className="text-xl font-semibold text-green-600 mt-4">🃏 Valeur des cartes</h2>
          <div className="bg-gray-50 p-3 rounded-md border">
            <h3 className="font-semibold mt-1">Atout choisi</h3>
            <ul className="pl-6 list-disc">
              <li>Valet : 20</li>
              <li>9 : 14</li>
              <li>As : 11</li>
              <li>10 : 10</li>
              <li>Roi : 4</li>
              <li>Dame : 3</li>
              <li>8, 7 : 0</li>
            </ul>

            <h3 className="font-semibold mt-3">Couleur non-atout</h3>
            <ul className="pl-6 list-disc">
              <li>As : 11</li>
              <li>10 : 10</li>
              <li>Roi : 4</li>
              <li>Dame : 3</li>
              <li>Valet : 2</li>
              <li>9, 8, 7 : 0</li>
            </ul>

            <h3 className="font-semibold mt-3">Sans Atout</h3>
            <ul className="pl-6 list-disc">
              <li>As : 19</li>
              <li>10 : 10</li>
              <li>Roi : 4</li>
              <li>Dame : 3</li>
              <li>Valet : 2</li>
              <li>9, 8, 7 : 0</li>
            </ul>

            <h3 className="font-semibold mt-3">Tout Atout</h3>
            <ul className="pl-6 list-disc">
              <li>Valet : 14</li>
              <li>9 : 9</li>
              <li>As : 6</li>
              <li>10 : 5</li>
              <li>Roi : 3</li>
              <li>Dame : 1</li>
              <li>8, 7 : 0</li>
            </ul>
          </div>

          <h2 className="text-xl font-semibold text-green-600 mt-4">📊 Calcul des points</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Le preneur doit atteindre son contrat avec ses plis + éventuelle Belote/Rebelote.</li>
            <li>Si le preneur réussit : il marque ses points + contrat, l’adversaire aussi ses plis.</li>
            <li>Si le preneur échoue et aucun adversaire n’a coinché : 0 pour le preneur, +162 +mise pour l’adversaire.</li>
            
          </ul>

          <h2 className="text-xl font-semibold text-green-600 mt-4">🏆 Objectif</h2>
          <p>
            Chaque joueur joue <strong>pour soi</strong>.  
            La partie se joue généralement en <strong>1000 points</strong>.  
            Le premier à atteindre ce score gagne 🎉.
          </p>

        </section>
      </div>
    </div>
  );
}
