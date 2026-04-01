export class ResultView {
  constructor({ resultText, candidateList, status }) {
    this.resultText = resultText;
    this.candidateList = candidateList;
    this.status = status;
  }

  setStatus(message) {
    this.status.textContent = message;
  }

  setResultText(text) {
    this.resultText.textContent = text;
  }

  setCandidates(candidates = []) {
    this.candidateList.innerHTML = "";

    if (!candidates.length) {
      const item = document.createElement("li");
      item.textContent = "No alternatives returned.";
      this.candidateList.append(item);
      return;
    }

    for (const candidate of candidates) {
      const item = document.createElement("li");
      item.textContent = candidate;
      this.candidateList.append(item);
    }
  }
}
