/* Minha conta: foto, como quer ser chamado, nome, telefone e senha. Só para quem está logado. */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  $("year").textContent = new Date().getFullYear();

  const say = (id, text, good) => { const el = $(id); el.textContent = text; el.hidden = !text; el.style.color = good ? "#25683b" : ""; };

  function paintAvatar(me) {
    const a = $("prof-avatar");
    if (me.avatarUrl) a.innerHTML = `<img src="${esc(me.avatarUrl)}" alt="" width="96" height="96">`;
    else a.textContent = ((me.displayName || me.name || me.email || "?").trim()[0] || "?").toUpperCase();
    $("prof-remove").hidden = !me.avatarUrl;
  }

  async function fill() {
    const me = await API.profile.me();
    if (!me) return false;
    const f = $("prof-form");
    f.displayName.value = me.displayName;
    f.name.value = me.name;
    f.email.value = me.email;
    f.phone.value = me.phone;
    paintAvatar(me);
    return true;
  }

  // Reduz a foto para 256x256 (recorte central) antes de enviar: fica leve e padronizada
  function shrink(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const S = 256, side = Math.min(img.width, img.height);
        const c = document.createElement("canvas");
        c.width = S; c.height = S;
        c.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, S, S);
        URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img")); };
      img.src = url;
    });
  }

  $("prof-file").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return say("prof-msg", "Use uma imagem JPG, PNG ou WEBP.");
    if (file.size > 8 * 1024 * 1024) return say("prof-msg", "Essa imagem é muito grande. Escolha uma de até 8 MB.");
    say("prof-msg", "Enviando a foto...", true);
    try {
      const r = await API.profile.uploadAvatar(await shrink(file));
      if (!r.ok) return say("prof-msg", r.message);
      await fill();
      say("prof-msg", "Foto atualizada!", true);
    } catch (err) { say("prof-msg", "Não foi possível usar essa imagem. Tente outra."); }
  });

  $("prof-remove").addEventListener("click", async () => {
    const r = await API.profile.removeAvatar();
    if (!r.ok) return say("prof-msg", r.message);
    await fill();
    say("prof-msg", "Foto removida.", true);
  });

  $("prof-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.name.value.trim().split(/\s+/).length < 2) return say("prof-msg", "Informe seu nome completo (nome e sobrenome).");
    const r = await API.profile.update({ name: f.name.value, displayName: f.displayName.value, phone: f.phone.value });
    say("prof-msg", r.ok ? "Dados salvos!" : r.message, r.ok);
  });

  $("pass-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.password.value.length < 8) return say("pass-msg", "A senha precisa ter pelo menos 8 caracteres.");
    const r = await API.auth.updatePassword(f.password.value);
    f.password.value = "";
    say("pass-msg", r.ok ? "Senha trocada!" : r.message, r.ok);
  });

  $("prof-out").addEventListener("click", async () => { await API.auth.signOut(); location.href = "index.html"; });

  (async function init() {
    const user = await API.auth.currentUser();
    if (!user || user.demo) { location.replace("entrar.html?next=perfil.html"); return; }
    if (!(await fill())) { location.replace("entrar.html?next=perfil.html"); return; }
    ["prof-card", "pass-card", "out-card"].forEach((id) => ($(id).hidden = false));
  })();
})();
