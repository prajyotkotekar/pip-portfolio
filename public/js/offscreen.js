// Rooms you can't see don't need to keep twinkling. Every looping CSS animation (stars, crickets,
// the mobile, the music box hint) pauses while its room is off screen, so scrolling stays smooth.
export function initOffscreenPause() {
  const rooms = document.querySelectorAll(".hero, .about, .story__intro, .scene, .made__head, .exhibit, .wishes, .foot");
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle("is-away", !e.isIntersecting)),
    { rootMargin: "200px 0px" },
  );
  rooms.forEach((room) => {
    room.classList.add("is-away");
    io.observe(room);
  });
}
