fetch("/db.json")
  .then(res => res.json())
  .then(db => {
    const container = document.getElementById("videos");
    db.videos.forEach(v => {
      const div = document.createElement("div");
      div.innerHTML = `<a href="/watch/${v.id}">${v.title}</a>`;
      container.appendChild(div);
    });
  });
