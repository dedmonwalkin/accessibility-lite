export const PROJECT_OPTIONS = [
  { value: 'unsure', label: 'Not sure yet' },
  { value: 'website', label: 'Web or document' },
  { value: 'media', label: 'Media' },
  { value: 'reporting', label: 'Reporting' }
];

// This is a scoping aid, deliberately not a legal applicability calculator.
export function projectOutline(focus) {
  const outlines = {
    unsure: { title: 'Start with one important task.', text: 'Choose something people need to do: request a service, read a notice, or follow a meeting. Bring the public link and describe where someone gets stuck. That gives us a useful starting point for the scope.' },
    website: { title: 'Choose a representative service journey.', text: 'Bring a public website link, a key form or document, and the task a person needs to complete. A scoped examination can then identify representative pages, testing methods, evidence, and remediation priorities.' },
    media: { title: 'Inventory the recording and its access needs.', text: 'Note the format, duration, spoken languages, and whether captions, a transcript, or descriptions already exist. Use public or non-sensitive samples only. Agree the accuracy review and intended audience before choosing tools.' },
    reporting: { title: 'Start with the requested evidence.', text: 'Bring the reporting request or procurement requirements, your organization type, location, and any stated deadline. Scope the supporting record and unresolved questions. Legal applicability and certification responsibilities need separate confirmation.' }
  };
  return Object.hasOwn(outlines, focus) ? outlines[focus] : outlines.unsure;
}

export function plannerScript() {
  return `
  (function () {
    var outline = ${projectOutline.toString()};
    var planner = document.getElementById('projectPlanner');
    var focus = document.getElementById('projectFocus');
    var button = document.getElementById('outlineButton');
    var title = document.getElementById('outlineTitle');
    var text = document.getElementById('outlineText');
    if (!planner || !focus || !button || !title || !text) return;
    button.addEventListener('click', function () {
      var result = outline(focus.value);
      title.textContent = result.title;
      text.textContent = result.text;
    });
    planner.hidden = false;
  })();`;
}
