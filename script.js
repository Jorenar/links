function createList(parent, list) {
  Object.keys(list).sort().forEach(function(key) {
    let value = list[key];

    let li = document.createElement('li');
    let details = document.createElement('details');
    let summary = document.createElement('summary');

    summary.innerText = key;
    details.appendChild(summary);
    let ul = document.createElement('ul');

    if (typeof value === 'object' && !(value instanceof Array)) {
      createList(ul, value);
      details.appendChild(ul);
      li.appendChild(details);
    } else {
      let a = document.createElement('a');
      a.innerText = key;
      a.href = value;
      li.appendChild(a);
    }

    parent.appendChild(li);
  });
}

fetch('list.json').then(response => response.json()).then(list => {
  let ul = document.createElement('ul');
  createList(ul, list);
  document.getElementsByTagName('main')[0].appendChild(ul);
});
