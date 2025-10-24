const pathParts = window.location.pathname.split("/");
const id = pathParts[pathParts.length - 1];

fetch("/db.json")
  .then(res => res.json())
  .then(db => {
    const v = db.videos.find(x => x.id === id);
    if (!v) return;
    document.getElementById("videoPlayer").src = `/uploads/${v.filename}`;
    document.getElementById("title").innerText = v.title;
    document.getElementById("description").innerText = v.description;
    document.getElementById("likesCount").innerText = v.likes;
  });

document.getElementById("likeBtn").addEventListener("click", () => {
  fetch(`/like/${id}`, { method: "POST" })
    .then(res => res.json())
    .then(d => document.getElementById("likesCount").innerText = d.likes);
});
