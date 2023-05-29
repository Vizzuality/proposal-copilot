import Alpine from "alpinejs";
Alpine.store("uploadStore", {
  showForm: false,
  title: "",
});

// Singleton function
const SingletonFunction = (() => {
  function callFunction(functionCalled, params) {
    console.log("singleton params:");
    console.log(params);
    return functionCalled(params);
  }

  return {
    callFunction: callFunction,
  };
})();

// Factory for API call functions
const apiFunctionFactory = {
  uploadFile: function (params) {
    const url = "/pdf-upload";
    const formData = new FormData();
    formData.append("file", params.file);

    return fetch(url, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          document.getElementById("upload-response").innerText = data["error"];
        } else {
          console.log(data["response"]);
          Alpine.store("uploadStore").showForm = false;
          console.log(Alpine.store("uploadStore").showForm);
          Alpine.store("uploadStore").title = data["response"];
          console.log(Alpine.store("uploadStore").title);
        }
        return data;
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  },
  analyzePDF: function (formId = null, formData = null) {
    const url = "/analyze-pdf";
    if (formId && document.getElementById(formId)) {
      const form = document.getElementById(formId);
      formData = new FormData(form);
      formData.append("analysis-type", "new-section");
    } else if (!formData) {
      formData = new FormData(); // create a new empty FormData object if no formId and no formData provided
      console.log("I'm deleting your data");
    }
    return fetch(url, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          document.getElementById("prompt-response").innerText = data["error"];
        } else {
          const editorContent = document.getElementById("editor-content"); // get editor-content element
          for (const key in data) {
            // clone template node and remove the id
            const sectionContainer = document
              .getElementById("proposal-section-container")
              .cloneNode(true);
            sectionContainer.removeAttribute("id");
            sectionContainer.id = "section-container-" + key.replace(/ /g, "-"); // unique id for each div

            const sectionDiv =
              sectionContainer.querySelector("#proposal-section");
            sectionDiv.removeAttribute("id");
            sectionDiv.id = "section-div-" + key.replace(/ /g, "-");

            // Create h3 element, set its text content and append it to the proposal section
            const h3 = document.createElement("h3");
            h3.textContent = key;
            sectionDiv.appendChild(h3);

            // Create p element, set its text content and append it to the proposal section
            const p = document.createElement("p");
            p.textContent = data[key]["response"];
            sectionDiv.appendChild(p);

            editorContent.appendChild(sectionContainer); // append the new node to editor-content
          }
        }
        return data;
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  },
};

document.getElementById("upload-form").addEventListener("submit", function (e) {
  e.preventDefault();
});
// Dragover handler to set the drop effect.
document
  .getElementById("upload-form")
  .addEventListener("dragover", function (e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  });

// Drop handler to get the files.
document.getElementById("upload-form").addEventListener("drop", function (e) {
  e.preventDefault();
  e.stopPropagation();
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    SingletonFunction.callFunction(apiFunctionFactory.uploadFile, {
      file: files[0],
    });
  }
});

document.getElementById("file-upload").addEventListener("change", function (e) {
  e.preventDefault();
  const files = e.target.files;
  if (files.length > 0) {
    SingletonFunction.callFunction(apiFunctionFactory.uploadFile, {
      file: files[0],
    });
  }
});
document
  .getElementById("new-section")
  .addEventListener("submit", function (event) {
    console.log("submit");
    event.preventDefault();
    apiFunctionFactory.analyzePDF("new-section");
  });

document.addEventListener("alpine:init", () => {
  Alpine.data("buttonHandlers", () => ({
    elaborate(event) {
      event.preventDefault();
      console.log("elaborate button clicked");
      const buttonData = getButtonData(event.target);
      const formData = new FormData();
      formData.append("section-prompt", buttonData.textContent);
      formData.append("section-title", buttonData.sectionName);
      formData.append("analysis-type", "elaborate");
      for (var pair of formData.entries()) {
        console.log(pair[0] + ", " + pair[1]);
      }
      apiFunctionFactory.analyzePDF(null, formData);
    },
    // Other handlers here
  }));
});

function getButtonData(button) {
  // Get the closest ancestor div with an id that starts with "section-container-"
  const containerDiv = button.closest('div[id^="section-container-"]');

  if (!containerDiv) {
    console.error(
      "Button must be inside a div with an id that starts with 'section-container-'."
    );
    return null;
  }

  // Extract the dynamic section name from the id
  const sectionName = containerDiv.id.slice("section-container-".length);

  // Get the text inside the div
  const textContent = containerDiv.innerText;

  return { sectionName, textContent };
}

Alpine.start();
