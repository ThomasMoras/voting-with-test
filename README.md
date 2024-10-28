# Voting system including complet set of tests

Projet de Système de Vote Alyra, utilisant la version plus.

## Explications des tests

### Phase de registration =>"Registration phase"

- Permet de tester le déploiement du contrat et donc la propriété de celui-ci par le owner
- Pour des raisons pratiques, le owner est ajouter en tant que voter par défaut
- Test du modifier onlyVoters sur la fonction getVoter
- Test l'ajout de différents voters, ainsi que la suppression d'un voter
- Test droit d'exécution des fonctions (addVoter, deleteVoter) sur le modifier onlyOwner


