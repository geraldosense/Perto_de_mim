const STORAGE_KEY = "perto_de_mim_session";
const USERS_KEY = "perto_de_mim_users";

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function initRegisterForm() {
  const form = document.getElementById("register-form");
  const msg = document.getElementById("form-msg");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const email = String(data.get("email")).trim().toLowerCase();
    const users = getUsers();
    if (users.some((u) => u.email === email)) {
      msg.textContent = "Este email já está registado.";
      msg.className = "form-msg form-msg--err";
      msg.hidden = false;
      return;
    }
    users.push({
      name: data.get("name"),
      email,
      password: data.get("password"),
      role: data.get("role"),
    });
    saveUsers(users);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ email, name: data.get("name"), role: data.get("role") })
    );
    msg.textContent = "Conta criada! A redirecionar…";
    msg.className = "form-msg form-msg--ok";
    msg.hidden = false;
    setTimeout(() => {
      location.href = "index.html";
    }, 900);
  });
}

export function initLoginForm() {
  const form = document.getElementById("login-form");
  const msg = document.getElementById("form-msg");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const email = String(data.get("email")).trim().toLowerCase();
    const password = data.get("password");
    const user = getUsers().find(
      (u) => u.email === email && u.password === password
    );
    if (!user) {
      msg.textContent = "Email ou palavra-passe incorretos. Regista-te primeiro.";
      msg.className = "form-msg form-msg--err";
      msg.hidden = false;
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ email: user.email, name: user.name, role: user.role })
    );
    msg.textContent = `Bem-vindo, ${user.name}!`;
    msg.className = "form-msg form-msg--ok";
    msg.hidden = false;
    setTimeout(() => {
      location.href = "index.html";
    }, 900);
  });
}
