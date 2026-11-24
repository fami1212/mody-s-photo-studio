# Corrections avant la mise en production

## À faire
- Reproduire et corriger l’erreur de la page publique « Shootings », avec un état de secours lisible si les données ne répondent pas.
- Rendre la navigation et l’envoi des photos plus rapides dans l’administration.
- Faire apparaître immédiatement sur l’accueil la photo choisie par l’administrateur.
- Réparer l’envoi du formulaire de réservation et confirmer que la demande est visible dans l’administration.

## Vérification
- Tester les pages et les actions dans la prévisualisation reliée aux données actuelles.
- Confirmer que le domaine de production n’est pas encore configuré : la vérification directe en production et le sitemap resteront en attente de publication.

## Détails techniques
- S’appuyer sur les journaux disponibles et les données actuelles pour isoler l’erreur, sans révéler les réservations existantes.
- Utiliser les miniatures existantes dans les vues d’administration, corriger les chargements de photos et éviter les URL d’images mises en cache après un changement.
- Conserver les réservations dans la table existante et supprimer uniquement la réservation de test après vérification.