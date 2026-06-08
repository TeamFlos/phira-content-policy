[中文](README.md) | **English**

# Phira Content Policy

A structured content policy database for the [Phira](https://phira.teamflos.com/) community. It provides queryable, traceable copyright policy information to determine whether a track, rights holder, or artist is allowed on Phira.

**Live site: [teamflos.github.io/phira-content-policy](https://teamflos.github.io/phira-content-policy/)**

## Data Source

Data is stored as TOML files under `data/`, maintained via Git:

```
data/
  rights_holders/  ← Rights holders (one subdirectory each)
    lowiro/
      _policy.toml   # The rights holder's own policy
      *.toml          # Track entries (can be split across files)
  artists/          ← Artist-level policies (one .toml per artist)
  independent/      ← Tracks without a clear rights holder
```

Found an error? Report it via [Issues](https://github.com/TeamFlos/phira-content-policy/issues).
