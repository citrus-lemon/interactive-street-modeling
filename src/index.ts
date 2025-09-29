declare const __MPA_ENTRIES__: string[];
document.querySelector("#root")!.innerHTML = `
  <h1>Pages</h1>
  <ul>
    ${__MPA_ENTRIES__
      .map((name) => `<li><a href="/${name}">${name}</a></li>`)
      .join("")}
  </ul>
`;
