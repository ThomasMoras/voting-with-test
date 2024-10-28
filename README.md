# Voting system including complet set of tests

Projet de Système de Vote Alyra, utilisant la version plus.
J'ai commenté les fonctions qui étaient définies plusieurs fois dans le contrat et que je n'ai pas testées pour avoir une couverture de test cohérente.

## Explications des tests

### Explication des fixtures utilisées
J'ai choisi de créer 4 fixtures représentant les 4 étapes clef du workflows contenant les états de la blockchain nécessaire aux tests de ces étapes.
Par exemple, la fixture voting registration contient les voters, ainsi que les proposals qui ont auparavant été testé dans la section "Proposal Phase"
Ce qui évite la redondance de tests déjà effectués

### Test sur la manipulation du workflow
- Test sur le changement d'étape d'un workflows pour vérifier l'incrémentation
- Uniquement le onlyowner peut changer l'état du workflow


### Phase de registration =>"Registration phase"

- Permet de tester le déploiement du contrat et donc la propriété de celui-ci par le owner
- Pour des raisons pratiques, le owner est ajouter en tant que voter par défaut
- Test du modifier onlyVoters sur la fonction getVoter
- Test l'ajout de différents voters, ainsi que la suppression d'un voter
- Test droit d'exécution des fonctions (addVoter, deleteVoter) sur le modifier onlyOwner

### Phase de proposition =>"Proposal phase"

- On vérifie que le workflow est dans le statut de proposition
- Test du modifier Onlyvoter sur la soumission d'une proposition
- Un voter peut soumettre plusieurs propositions
- Test de la soumission d'une proposition vide qui entraîne un revert
- Test du vote lors de la période de soumission des propositions qui entraîne un revert

### Phase de vote =>"Voting phase"

- On vérifie que le workflow est dans le statut de vote
- Test du modifier Onlyvoter sur la soumission d'un vote
- Test du vote sur une proposition inexistante
- Test d'un voter qui essaie de voter plusieurs fois
- Vérification que la structure solidity du voter est à jour (bool hasVoted, votedProposalId)
- Vérification que le compteur de vote est bien à jour sur les propositions
- Vérifie que l'owner ne peut pas lancer le décompte des votes durant la phase de vote

### Phase de comptage des votes =>"Tally vote phase"
  
- Un voter ne peut plus voter durant la phase de comptage des votes
- Seulement l'owner peut lancer le décompte des votes
- Lance le décompte des votes et vérifie que la proposition gagnante est bien celle qui corresponds aux jeux de test (ici la proposition 3)
- On vérifie que le dernier changement a bien fonctionné lors du décompte des votes et que l'événement est soumis.
- On vérifie également que peu importe le user (voter ou non), on peut récupérer la proposition gagnante