import React, { useState } from "react";

type Synonym = {
  word: string;
  score: number;
};
const BASE_URL = "https://api.datamuse.com";

export const FindSynonyms = () => {
  const [word, setWord] = useState("");
  const [synonyms, setSynonyms] = useState<Synonym[]>([]);

  const fetchSynonyms = (word: string) => {
    fetch(`${BASE_URL}/words?rel_syn=${word}`)
      .then((response) => response.json())
      .then(setSynonyms);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSynonyms(word);
  };

  const handleSynonymClicked = (newWord: string) => {
    setWord(newWord);
    fetchSynonyms(newWord);
  };

  return (
    <div>
      {" "}
      <form
        action=""
        className="flex items-center justify-center mt-10 text-xl gap-3"
        onSubmit={handleSubmit}
      >
        <input
          value={word}
          className="p-2 w-72 rounded-xl outline-none"
          type="text"
          placeholder="Find synonyms..."
          onChange={(e) => setWord(e.target.value)}
        ></input>
        <button
          onClick={() => fetchSynonyms(word)}
          className="bg-[#252525] p-2 rounded-xl text-white w-24 hover:scale-110 hover:duration-300"
          type="button"
        >
          Submit
        </button>
      </form>
      <ul className="grid justify-center items-center grid-cols-4 mx-16  text-2xl mt-8 text-[#303030] gap-6">
        {synonyms.map((synonym) => (
          <li
            onClick={() => handleSynonymClicked(synonym.word)}
            className="text-center cursor-pointer hover:scale-110 hover:duration-300 bg-white rounded-xl drop-shadow-xl"
            key={synonym.word}
          >
            {synonym.word}
          </li>
        ))}
      </ul>
    </div>
  );
};
