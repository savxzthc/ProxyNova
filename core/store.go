package core

import (
	"encoding/json"

	bolt "go.etcd.io/bbolt"
)

type Store struct {
	db *bolt.DB
}

var (
	bucketSettings = []byte("settings")
	bucketJudges   = []byte("judges")
	bucketSources  = []byte("sources")
)

func NewStore(path string) (*Store, error) {
	db, err := bolt.Open(path, 0600, nil)
	if err != nil {
		return nil, err
	}

	err = db.Update(func(tx *bolt.Tx) error {
		for _, b := range [][]byte{bucketSettings, bucketJudges, bucketSources} {
			if _, err := tx.CreateBucketIfNotExists(b); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		db.Close()
		return nil, err
	}

	return &Store{db: db}, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) SaveSettings(settings AppSettings) error {
	return s.putJSON(bucketSettings, []byte("app"), settings)
}

func (s *Store) LoadSettings() (AppSettings, error) {
	defaults := AppSettings{
		DefaultThreads: 200,
		DefaultTimeout: 5000,
		ExportFormat:   "txt",
		TXTFormat:      "host:port",
		Theme:          "dark",
	}
	var out AppSettings
	if err := s.getJSON(bucketSettings, []byte("app"), &out); err != nil {
		return defaults, nil
	}
	return out, nil
}

func (s *Store) SaveJudges(judges []Judge) error {
	return s.putJSON(bucketJudges, []byte("list"), judges)
}

func (s *Store) LoadJudges() ([]Judge, error) {
	var out []Judge
	if err := s.getJSON(bucketJudges, []byte("list"), &out); err != nil || len(out) == 0 {
		return DefaultJudges(), nil
	}
	return out, nil
}

func (s *Store) SaveSources(sources []ScrapeSource) error {
	return s.putJSON(bucketSources, []byte("list"), sources)
}

func (s *Store) LoadSources() ([]ScrapeSource, error) {
	var out []ScrapeSource
	if err := s.getJSON(bucketSources, []byte("list"), &out); err != nil || len(out) == 0 {
		return DefaultSources(), nil
	}
	return out, nil
}

func (s *Store) putJSON(bucket, key []byte, v interface{}) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return s.db.Update(func(tx *bolt.Tx) error {
		return tx.Bucket(bucket).Put(key, data)
	})
}

func (s *Store) getJSON(bucket, key []byte, v interface{}) error {
	return s.db.View(func(tx *bolt.Tx) error {
		data := tx.Bucket(bucket).Get(key)
		if data == nil {
			return bolt.ErrBucketNotFound
		}
		return json.Unmarshal(data, v)
	})
}
