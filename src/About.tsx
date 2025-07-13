import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

const GITHUB_RAW_MD =
"https://raw.githubusercontent.com/siridesai/PolyglotStemBuddy/refs/heads/main/about.md" ;
// if you're using local about.md, then set this to ./about.md. 

const About: React.FC = () => {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    fetch(GITHUB_RAW_MD)
      .then((res) => res.text())
      .then(setContent);
  }, []);

  return (
    <div className="min-h-screen bg-sketch-doodles flex flex-col">
      <div className="prose text-black max-w-3xl mx-auto px-4 py-10 flex-1">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default About;
