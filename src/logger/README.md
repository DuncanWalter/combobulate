# Logger

Server main file is `src/main.ts`- shouldn't really use many more files. Will probably need node built in modules `fs`, `path`

Needs 3 endpoints, I think:

GET logs: return a list of available logs and any metadata you think is small + helpful
GET log: return the content of a named log
POST log: update a stored log or create a new stored log (updating could be useful if we want it to same work)

The data of a log will be

```javascript
{
  agentType: 'contextless' | 'suit-counting' | 'card-counting' | 'context-learning',
  simplified: boolean,
  gamesPlayed: number,
  // The number of suits in use
  suitCount: number,
  // Used to identify a log
  sessionName: string,
  creationTime: number,
  lastUpdate: number,
  // Net Weights, which are the only real thing we're saving
  qualityWeights: number[][][],
}
```
