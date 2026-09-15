function showTab(which) {
  const isLogin = which === "login";
  document.getElementById("loginForm").style.display = isLogin ? "flex" : "none";
  document.getElementById("signupForm").style.display = isLogin ? "none" : "flex";
  document.getElementById("tabLoginBtn").classList.toggle("active", isLogin);
  document.getElementById("tabSignupBtn").classList.toggle("active", !isLogin);
}

function showMsg(elId, text, type) {
  const el = document.getElementById(elId);
  el.textContent = text;
  el.className = "msg " + type;
}

// If a session already exists, skip straight to the dashboard.
(async function checkExistingSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) window.location.href = "dashboard.html";
})();

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    showMsg("loginMsg", error.message, "error");
    return;
  }
  window.location.href = "dashboard.html";
});

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const full_name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { full_name } }
  });

  if (error) {
    showMsg("signupMsg", error.message, "error");
    return;
  }
  showMsg(
    "signupMsg",
    "Account created. If email confirmation is enabled on your Supabase project, check your inbox, then log in.",
    "success"
  );
  document.getElementById("signupForm").reset();
});
