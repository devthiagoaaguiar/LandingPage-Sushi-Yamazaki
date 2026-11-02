(() => {
    "use strict";

    const WHATSAPP = "559298261-7123"; // troque pelo número real do Yamazaki
    const BRAND = "Yamazaki Sushi";

    const $ = (s) => document.querySelector(s);
    const $$ = (s) => Array.from(document.querySelectorAll(s));
    const fmt = (v) =>
        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    /* - navbar - */
    const nav = $("#navbar");
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* - menu mobile - */
    const mobileBtn = $("#nav-mobile-toggle");
    const mobileMenu = $("#mobile-menu");
    mobileBtn.addEventListener("click", () => {
        const open = mobileMenu.classList.toggle("open");
        mobileBtn.setAttribute("aria-expanded", String(open));
    });
    $$(".mobile-link").forEach((l) =>
        l.addEventListener("click", () => mobileMenu.classList.remove("open"))
    );

    /* - reveals - */
    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add("visible");
                    io.unobserve(e.target);
                }
            });
        },
        { threshold: 0.15 }
    );
    $$(".reveal").forEach((el) => io.observe(el));

    /* - parallax - */
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pEls = $$("[data-parallax]");
    if (!reduced && pEls.length) {
        const loop = () => {
            const vh = window.innerHeight;
            pEls.forEach((el) => {
                const r = el.getBoundingClientRect();
                if (r.bottom < -100 || r.top > vh + 100) return;
                const speed = parseFloat(el.dataset.parallax) || 0.1;
                const delta = (r.top + r.height / 2 - vh / 2) * speed;
                el.style.transform = `translate3d(0, ${delta.toFixed(1)}px, 0)`;
            });
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    /* - spotlight dos pratos - */
    $$(".dish-card").forEach((card) =>
        card.addEventListener("mousemove", (e) => {
            const r = card.getBoundingClientRect();
            card.style.setProperty("--mx", `${e.clientX - r.left}px`);
            card.style.setProperty("--my", `${e.clientY - r.top}px`);
        })
    );

    /* - toasts - */
    const toastBox = $("#toast-container");
    const ICON_CHECK =
        '<svg class="ic toast-icon" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>';
    function toast(message, actionLabel, actionFn) {
        const el = document.createElement("div");
        el.className = "toast";
        el.setAttribute("data-testid", "toast");
        el.innerHTML = `${ICON_CHECK}<span>${message}</span>${actionLabel ? '<button type="button" class="toast-action"></button>' : ""
            }`;
        if (actionLabel) {
            const b = el.querySelector(".toast-action");
            b.textContent = actionLabel;
            b.addEventListener("click", () => {
                actionFn();
                dismiss();
            });
        }
        toastBox.appendChild(el);
        const dismiss = () => {
            el.classList.add("hide");
            setTimeout(() => el.remove(), 320);
        };
        setTimeout(dismiss, 3800);
    }

    /* - carrinho - */
    const ICON_TRASH =
        '<svg class="ic" viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>';
    const ICON_MINUS =
        '<svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>';
    const ICON_PLUS =
        '<svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';

    const KEY = "yamazaki-cart";
    let lines = [];
    try {
        lines = JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
        lines = [];
    }
    let mode = "delivery";

    const drawer = $("#cart-drawer");
    const overlay = $("#cart-overlay");

    const save = () => localStorage.setItem(KEY, JSON.stringify(lines));
    const openCart = () => {
        drawer.classList.add("open");
        overlay.classList.remove("hidden");
        requestAnimationFrame(() => overlay.classList.add("open"));
        drawer.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    };
    const closeCart = () => {
        drawer.classList.remove("open");
        overlay.classList.remove("open");
        drawer.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        setTimeout(() => overlay.classList.add("hidden"), 320);
    };

    $("#cart-open").addEventListener("click", openCart);
    $("#cart-close").addEventListener("click", closeCart);
    overlay.addEventListener("click", closeCart);
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeCart();
    });

    $$(".dish-add").forEach((btn) =>
        btn.addEventListener("click", () => {
            const { id, name, price, portion, image } = btn.dataset;
            const found = lines.find((l) => l.id === id);
            if (found) found.qty += 1;
            else lines.push({ id, name, price: parseFloat(price), portion, image, qty: 1 });
            save();
            renderCart();
            toast(`${name} adicionado ao pedido`, "Ver pedido", openCart);
        })
    );

    $("#cart-lines").addEventListener("click", (e) => {
        const minus = e.target.closest("[data-qty-minus]");
        const plus = e.target.closest("[data-qty-plus]");
        const remove = e.target.closest("[data-remove]");
        if (minus) {
            const l = lines.find((x) => x.id === minus.dataset.qtyMinus);
            l.qty -= 1;
            if (l.qty <= 0) lines = lines.filter((x) => x.id !== l.id);
            save();
            renderCart();
        } else if (plus) {
            const l = lines.find((x) => x.id === plus.dataset.qtyPlus);
            l.qty += 1;
            save();
            renderCart();
        } else if (remove) {
            lines = lines.filter((x) => x.id !== remove.dataset.remove);
            save();
            renderCart();
        }
    });

    $$(".mode-btn").forEach((b) =>
        b.addEventListener("click", () => {
            mode = b.dataset.mode;
            $$(".mode-btn").forEach((x) => x.classList.toggle("active", x === b));
        })
    );

    function renderCart() {
        const count = lines.reduce((a, l) => a + l.qty, 0);
        const subtotal = lines.reduce((a, l) => a + l.qty * l.price, 0);

        const badge = $("#cart-count");
        badge.textContent = count;
        badge.classList.toggle("hidden", count === 0);

        const has = lines.length > 0;
        $("#cart-empty").classList.toggle("hidden", has);
        $("#cart-lines").classList.toggle("hidden", !has);
        $("#cart-footer").classList.toggle("hidden", !has);

        $("#cart-lines").innerHTML = lines
            .map(
                (l) => `
      <li class="cart-line" data-testid="cart-line-${l.id}">
        <img src="${l.image}" alt="${l.name}" class="cart-thumb" />
        <div class="cart-line-body">
          <div class="cart-line-top">
            <div>
              <p class="cart-line-name">${l.name}</p>
              <p class="cart-line-portion">${l.portion}</p>
            </div>
            <button type="button" class="cart-remove" data-remove="${l.id}" data-testid="cart-remove-${l.id}" aria-label="Remover ${l.name}">${ICON_TRASH}</button>
          </div>
          <div class="cart-line-bottom">
            <div class="qty">
              <button type="button" data-qty-minus="${l.id}" data-testid="cart-qty-minus-${l.id}" aria-label="Diminuir quantidade">${ICON_MINUS}</button>
              <span data-testid="cart-qty-value-${l.id}">${l.qty}</span>
              <button type="button" data-qty-plus="${l.id}" data-testid="cart-qty-plus-${l.id}" aria-label="Aumentar quantidade">${ICON_PLUS}</button>
            </div>
            <span class="cart-line-price" data-testid="cart-line-total-${l.id}">${fmt(l.qty * l.price)}</span>
          </div>
        </div>
      </li>`
            )
            .join("");

        $("#cart-subtotal").textContent = fmt(subtotal);
    }

    $("#cart-empty-menu").addEventListener("click", () => {
        closeCart();
        setTimeout(() => $("#menu").scrollIntoView({ behavior: "smooth" }), 250);
    });

    $("#cart-checkout").addEventListener("click", () => {
        const body = lines
            .map((l) => `• ${l.qty}x ${l.name} — ${fmt(l.qty * l.price)}`)
            .join("\n");
        const message = `Olá, ${BRAND}! Quero fazer um pedido:\n\n${body}\n\nTotal: ${fmt(
            lines.reduce((a, l) => a + l.qty * l.price, 0)
        )}\nModo: ${mode === "delivery" ? "Entrega" : "Retirada"}`;
        window.open(
            `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`,
            "_blank"
        );
    });

    renderCart();

    /* - filtros e busca - */
    const cards = $$(".dish-card");
    let activeCat = "Todos";

    function applyFilters() {
        const q = $("#menu-search").value.trim().toLowerCase();
        let visible = 0;
        cards.forEach((c) => {
            const okCat = activeCat === "Todos" || c.dataset.category === activeCat;
            const okQ = !q || c.dataset.search.includes(q);
            const show = okCat && okQ;
            c.classList.toggle("hidden", !show);
            if (show) visible++;
        });
        $("#menu-empty").classList.toggle("hidden", visible > 0);
        $("#menu-empty-query").textContent = q;
    }

    $$(".filter-btn").forEach((b) =>
        b.addEventListener("click", () => {
            activeCat = b.dataset.filter;
            $$(".filter-btn").forEach((x) => x.classList.toggle("active", x === b));
            applyFilters();
        })
    );

    $("#menu-search").addEventListener("input", applyFilters);

    $("#menu-empty-reset").addEventListener("click", () => {
        $("#menu-search").value = "";
        activeCat = "Todos";
        $$(".filter-btn").forEach((x) =>
            x.classList.toggle("active", x.dataset.filter === "Todos")
        );
        applyFilters();
    });

    /* - reservas - */
    const form = $("#reservation-form");
    const success = $("#reservation-success");
    const dateInput = form.querySelector('[name="date"]');
    dateInput.min = new Date().toISOString().split("T")[0];
    dateInput.value = dateInput.min;
    let reservationData = null;

    const formatDate = (iso) => {
        const d = new Date(`${iso}T12:00:00`);
        return d.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        reservationData = Object.fromEntries(new FormData(form));
        $("#res-success-summary").textContent =
            `${reservationData.name} · ${reservationData.guests} pessoa(s) · ${formatDate(reservationData.date)} às ${reservationData.time}`;
        form.classList.add("hidden");
        success.classList.remove("hidden");
        toast("Reserva recebida! Confirme pelo WhatsApp.");
    });

    $("#res-wa-button").addEventListener("click", () => {
        if (!reservationData) return;
        const { name, phone, date, time, guests, notes } = reservationData;
        const message =
            `Olá, ${BRAND}! Quero reservar uma mesa:\n\n` +
            `Nome: ${name}\nWhatsApp: ${phone}\nData: ${formatDate(date)}\nHorário: ${time}\nPessoas: ${guests}` +
            (notes ? `\nObservações: ${notes}` : "");
        window.open(
            `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`,
            "_blank"
        );
    });

    $("#res-reset-button").addEventListener("click", () => {
        form.reset();
        dateInput.value = dateInput.min;
        success.classList.add("hidden");
        form.classList.remove("hidden");
    });

    /* - ano do rodapé - */
    $("#footer-year").textContent = new Date().getFullYear();
})();
