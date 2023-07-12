import React, { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";

export default function SmartEditor() {
  const editorRef = useRef(null);

  const handleEditorInit = (evt, editor) => {
    editorRef.current = editor;
  };

  const handleLogContent = () => {
    if (editorRef.current) {
      console.log(editorRef.current.getContent());
    }
  };

  return (
    <>
      <Editor
        apiKey="your-api-key"
        onInit={handleEditorInit}
        initialValue="<p>This is the initial content of the editor.</p>"
        init={{
          height: 500,
          menubar: false,
          plugins: ["image"],
          toolbar: "image | TextImage",
          setup: (editor) => {
            editor.ui.registry.addButton("TextImage", {
              text: "TextImage",
              icon: "highlight-bg-color",
              tooltip:
                "Highlight a prompt and click this button to query ChatGPT",
              enabled: true,
              onAction: async () => {
                const selection = editor.selection.getContent();
                console.log(selection);
                const data = {
                  "text": selection
                }
                const response = await fetch("http://127.0.0.1:8000/api/grammar-correction/", {
                  method: "POST", // *GET, POST, PUT, DELETE, etc.
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(data), // body data type must match "Content-Type" header
                });
                response.json().then((response) => {
                  console.log(response.corrected_text)
                  editor.selection.setContent(response.corrected_text)
                })
              },
            });
          },
        }}
      />
      <button onClick={handleLogContent}>Log editor content</button>
    </>
  );
}
