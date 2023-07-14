import React, { useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import ReactLoading from "react-loading";
import { openPopupGrammarChecker } from "./Utils/grammarchecker";
import "./App.css";

function App() {
  const editorRef = useRef(null);
  const [grammerChecker, setGrammerChecker] = useState(false);

  const handleEditorInit = (evt, editor) => {
    editorRef.current = editor;
  };

  return (
    <>
      {grammerChecker ? (
        <ReactLoading
          type={"spin"}
          color="#0A99E5"
          height={100}
          width={100}
          className="ReactLoading"
        />
      ) : (
        <></>
      )}
      <Editor
        apiKey="your-api-key"
        onInit={handleEditorInit}
        initialValue="<p>This is the initial content of the editor.</p>"
        init={{
          height: 500,
          menubar: true,
          plugins: ["image"],
          toolbar: "image | GrammarChecker",
          setup: (editor) => {
            editor.ui.registry.addButton("GrammarChecker", {
              text: "Grammar Checker",
              icon: "highlight-bg-color",
              tooltip:
                "Highlight a prompt and click this button to query ChatGPT",
              enabled: true,
              onAction: async () => {
                const selection = editor.selection.getContent();

                if (selection !== "") {
                  setGrammerChecker(true);
                  const data = {
                    text: selection,
                  };
                  const response = await fetch(
                    "http://127.0.0.1:8000/api/grammar-correction/",
                    {
                      method: "POST", // *GET, POST, PUT, DELETE, etc.
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(data), // body data type must match "Content-Type" header
                    }
                  );
                  response.json().then((response) => {
                    setGrammerChecker(false);
                    let correctedText = response.corrected_text;
                    let matches = response.matches;
                    let grammarMistakes = [];
                    for (let match of matches) {
                      let mistakes = [];

                      let incorrectText = match[4];
                      // Calculate the start and end positions for the span element
                      let start = match[3];
                      let end = match[3] + match[6];

                      // Rearrange the incorrectText with the span element
                      let rearrangedText =
                        incorrectText.substring(0, start) +
                        `<span class="incorrecttext">` +
                        incorrectText.substring(start, end) +
                        "</span>" +
                        incorrectText.substring(end);

                      mistakes.push(rearrangedText);
                      mistakes.push(`<b>Error : </b> ` + match[8]);
                      mistakes.push(`<b>${match[1]}</b> `);
                      mistakes.push(
                        `<b>Suggestions : </b> <span class="suggestions">` +
                          match[2].slice(0, 2) +
                          "</span>"
                      );

                      grammarMistakes.push(mistakes);
                    }

                    openPopupGrammarChecker(
                      grammarMistakes,
                      editor,
                      correctedText,
                      matches.length
                    );
                  });
                } else {
                  alert("Please select a sentence");
                }
              },
            });
          },
        }}
      />
    </>
  );
}

export default App;
