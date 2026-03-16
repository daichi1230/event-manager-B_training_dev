import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEYS = {
  events: 'event-manager-b-events',
  session: 'event-manager-b-session'
};

const DEMO_USERS = [
  {
    id: 'admin-001',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    displayName: '管理者 佐藤'
  },
  {
    id: 'user-001',
    username: 'user1',
    password: 'user123',
    role: 'user',
    displayName: '一般ユーザー 田中'
  },
  {
    id: 'user-002',
    username: 'user2',
    password: 'user123',
    role: 'user',
    displayName: '一般ユーザー 鈴木'
  }
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'すべて' },
  { value: 'upcoming', label: '開催予定' },
  { value: 'full', label: '満員' },
  { value: 'available', label: '参加可能' }
];

const TAB_OPTIONS = [
  { value: 'events', label: 'イベント一覧' },
  { value: 'my-events', label: 'マイイベント' },
  { value: 'admin', label: '管理画面', adminOnly: true }
];

const EMPTY_FORM = {
  id: null,
  title: '',
  description: '',
  venue: '',
  date: '',
  capacity: '10',
  category: '勉強会'
};

const SEED_EVENTS = [
  {
    id: 'event-1001',
    title: '会計ソフト勉強会',
    description: '新卒向けに会計ソフトの画面構成やユースケースを学ぶ勉強会です。',
    venue: '会議室A',
    date: futureDate(5),
    capacity: 10,
    category: '勉強会',
    createdBy: 'admin-001',
    participants: ['user-001']
  },
  {
    id: 'event-1002',
    title: 'UIレビュー会',
    description: 'イベント管理サイトのUIをレビューし、改善案を議論します。',
    venue: 'オンライン',
    date: futureDate(12),
    capacity: 5,
    category: 'レビュー',
    createdBy: 'admin-001',
    participants: ['user-002']
  },
  {
    id: 'event-1003',
    title: '歓迎ランチ',
    description: '配属前にチームメンバーと交流するランチ会です。',
    venue: '社内ラウンジ',
    date: futureDate(2),
    capacity: 8,
    category: '交流',
    createdBy: 'admin-001',
    participants: []
  }
];

function futureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(18, 30, 0, 0);
  return date.toISOString().slice(0, 16);
}

function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.events);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(SEED_EVENTS));
      return SEED_EVENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_EVENTS;
  } catch {
    return SEED_EVENTS;
  }
}

function saveEvents(events) {
  localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.session);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(user));
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function isUpcoming(value) {
  return new Date(value).getTime() >= Date.now();
}

function App() {
  const [events, setEvents] = useState(() => loadEvents());
  const [currentUser, setCurrentUser] = useState(() => loadSession());
  const [activeTab, setActiveTab] = useState('events');
  const [selectedEventId, setSelectedEventId] = useState(() => loadEvents()[0]?.id ?? null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    saveEvents(events);
    if (!events.find((event) => event.id === selectedEventId)) {
      setSelectedEventId(events[0]?.id ?? null);
    }
  }, [events, selectedEventId]);

  useEffect(() => {
    saveSession(currentUser);
  }, [currentUser]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const joined = `${event.title} ${event.description} ${event.venue} ${event.category}`.toLowerCase();
      const matchesQuery = joined.includes(query.toLowerCase());
      const isFull = event.participants.length >= event.capacity;
      const matchesFilter =
        filter === 'all' ||
        (filter === 'upcoming' && isUpcoming(event.date)) ||
        (filter === 'full' && isFull) ||
        (filter === 'available' && !isFull);
      return matchesQuery && matchesFilter;
    });
  }, [events, filter, query]);

  const myEvents = useMemo(() => {
    if (!currentUser) {
      return [];
    }
    return events.filter((event) => event.participants.includes(currentUser.id));
  }, [currentUser, events]);

  const upcomingCount = useMemo(() => events.filter((event) => isUpcoming(event.date)).length, [events]);
  const fullCount = useMemo(
    () => events.filter((event) => event.participants.length >= event.capacity).length,
    [events]
  );

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setFormErrors({});
  };

  const showMessage = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2200);
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const match = DEMO_USERS.find(
      (user) =>
        user.username === loginForm.username.trim() && user.password === loginForm.password.trim()
    );

    if (!match) {
      setLoginError('ユーザー名またはパスワードが正しくありません。');
      return;
    }

    setCurrentUser(match);
    setLoginError('');
    setLoginForm({ username: '', password: '' });
    setActiveTab('events');
    showMessage(`${match.displayName} としてログインしました。`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('events');
    resetForm();
    showMessage('ログアウトしました。');
  };

  const handleJoin = (eventId) => {
    if (!currentUser) {
      showMessage('参加するにはログインしてください。');
      return;
    }

    const nextEvents = events.map((item) => {
      if (item.id !== eventId) {
        return item;
      }
      if (item.participants.includes(currentUser.id)) {
        return item;
      }
      if (item.participants.length >= item.capacity) {
        showMessage('このイベントは満員です。');
        return item;
      }
      return {
        ...item,
        participants: [...item.participants, currentUser.id]
      };
    });

    setEvents(nextEvents);
    showMessage('イベントに参加しました。');
  };

  const handleCancel = (eventId) => {
    if (!currentUser) {
      return;
    }

    const nextEvents = events.map((item) => {
      if (item.id !== eventId) {
        return item;
      }
      return {
        ...item,
        participants: item.participants.filter((participantId) => participantId !== currentUser.id)
      };
    });

    setEvents(nextEvents);
    showMessage('参加をキャンセルしました。');
  };

  const startEdit = (eventItem) => {
    setActiveTab('admin');
    setSelectedEventId(eventItem.id);
    setFormData({
      id: eventItem.id,
      title: eventItem.title,
      description: eventItem.description,
      venue: eventItem.venue,
      date: eventItem.date,
      capacity: String(eventItem.capacity),
      category: eventItem.category
    });
    setFormErrors({});
  };

  const handleDelete = (eventId) => {
    const target = events.find((event) => event.id === eventId);
    if (!target) {
      return;
    }

    const accepted = window.confirm(`「${target.title}」を削除しますか？`);
    if (!accepted) {
      return;
    }

    setEvents((prev) => prev.filter((event) => event.id !== eventId));
    resetForm();
    showMessage('イベントを削除しました。');
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.title.trim()) {
      nextErrors.title = 'タイトルは必須です。';
    }
    if (!formData.description.trim()) {
      nextErrors.description = '説明は必須です。';
    }
    if (!formData.venue.trim()) {
      nextErrors.venue = '会場は必須です。';
    }
    if (!formData.date) {
      nextErrors.date = '日時は必須です。';
    } else if (new Date(formData.date).getTime() < Date.now()) {
      nextErrors.date = '未来の日時を入力してください。';
    }

    const capacityNumber = Number(formData.capacity);
    if (!Number.isInteger(capacityNumber) || capacityNumber < 1 || capacityNumber > 100) {
      nextErrors.capacity = '定員は1〜100の整数で入力してください。';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = (event) => {
    event.preventDefault();
    if (!currentUser || currentUser.role !== 'admin') {
      return;
    }
    if (!validateForm()) {
      return;
    }

    const payload = {
      id: formData.id ?? `event-${crypto.randomUUID()}`,
      title: formData.title.trim(),
      description: formData.description.trim(),
      venue: formData.venue.trim(),
      date: formData.date,
      capacity: Number(formData.capacity),
      category: formData.category,
      createdBy: currentUser.id,
      participants: formData.id
        ? events.find((item) => item.id === formData.id)?.participants ?? []
        : []
    };

    if (formData.id) {
      setEvents((prev) => prev.map((item) => (item.id === formData.id ? payload : item)));
      showMessage('イベントを更新しました。');
    } else {
      setEvents((prev) => [payload, ...prev]);
      showMessage('イベントを作成しました。');
    }

    setSelectedEventId(payload.id);
    resetForm();
  };

  const visibleTabs = TAB_OPTIONS.filter((tab) => !tab.adminOnly || currentUser?.role === 'admin');

  return (
    <div className="app-shell">
      <header className="hero card">
        <div>
          <p className="eyebrow">B向け研修アプリ</p>
          <h1>Event Manager B</h1>
          <p className="hero-text">
            ログイン、ロール、イベント管理、参加登録、マイページを学ぶためのイベント管理サイトです。
          </p>
        </div>
        <div className="hero-stats">
          <StatCard label="総イベント数" value={events.length} />
          <StatCard label="開催予定" value={upcomingCount} />
          <StatCard label="満員" value={fullCount} />
        </div>
      </header>

      <section className="grid layout-top">
        <div className="card login-card">
          <div className="section-heading">
            <h2>ログイン</h2>
            <span className={`role-chip ${currentUser?.role ?? 'guest'}`}>
              {currentUser ? currentUser.role : 'guest'}
            </span>
          </div>

          {currentUser ? (
            <div className="login-state">
              <p>
                <strong>{currentUser.displayName}</strong> としてログイン中です。
              </p>
              <p className="muted">ユーザー名: {currentUser.username}</p>
              <button className="secondary-btn" onClick={handleLogout}>
                ログアウト
              </button>
            </div>
          ) : (
            <>
              <form className="stack-form" onSubmit={handleLogin}>
                <label>
                  <span>ユーザー名</span>
                  <input
                    value={loginForm.username}
                    onChange={(event) =>
                      setLoginForm((prev) => ({ ...prev, username: event.target.value }))
                    }
                    placeholder="admin / user1 / user2"
                  />
                </label>
                <label>
                  <span>パスワード</span>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    placeholder="admin123 または user123"
                  />
                </label>
                <button className="primary-btn" type="submit">
                  ログイン
                </button>
              </form>
              {loginError && <p className="error-text">{loginError}</p>}
              <div className="demo-box">
                <p className="demo-title">デモアカウント</p>
                <ul>
                  <li>管理者: admin / admin123</li>
                  <li>一般ユーザー: user1 / user123</li>
                  <li>一般ユーザー: user2 / user123</li>
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="card filters-card">
          <div className="section-heading">
            <h2>検索と絞り込み</h2>
          </div>
          <div className="filters-grid">
            <label>
              <span>検索</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="タイトル、説明、会場、カテゴリで検索"
              />
            </label>
            <label>
              <span>状態</span>
              <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                {FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {message && <p className="success-text">{message}</p>}
        </div>
      </section>

      <nav className="tab-row">
        {visibleTabs.map((tab) => (
          <button
            key={tab.value}
            className={tab.value === activeTab ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="grid main-grid">
        <div className="card left-pane">
          {activeTab === 'events' && (
            <EventList
              title="イベント一覧"
              events={filteredEvents}
              currentUser={currentUser}
              onSelect={setSelectedEventId}
              selectedEventId={selectedEventId}
              onJoin={handleJoin}
              onCancel={handleCancel}
              onEdit={startEdit}
              onDelete={handleDelete}
            />
          )}

          {activeTab === 'my-events' && (
            <EventList
              title="マイイベント"
              events={myEvents}
              currentUser={currentUser}
              onSelect={setSelectedEventId}
              selectedEventId={selectedEventId}
              onJoin={handleJoin}
              onCancel={handleCancel}
              onEdit={startEdit}
              onDelete={handleDelete}
              emptyMessage={
                currentUser
                  ? '参加中のイベントはありません。イベント一覧から参加してください。'
                  : 'ログインすると参加中イベントが表示されます。'
              }
            />
          )}

          {activeTab === 'admin' && currentUser?.role === 'admin' && (
            <AdminForm
              formData={formData}
              setFormData={setFormData}
              formErrors={formErrors}
              onSave={handleSave}
              onReset={resetForm}
            />
          )}
        </div>

        <div className="card right-pane">
          <EventDetail
            event={selectedEvent}
            currentUser={currentUser}
            onJoin={handleJoin}
            onCancel={handleCancel}
            onEdit={startEdit}
            onDelete={handleDelete}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EventList({
  title,
  events,
  currentUser,
  onSelect,
  selectedEventId,
  onJoin,
  onCancel,
  onEdit,
  onDelete,
  emptyMessage = '該当するイベントはありません。'
}) {
  return (
    <div>
      <div className="section-heading">
        <h2>{title}</h2>
        <span className="muted">{events.length}件</span>
      </div>
      <div className="event-list">
        {events.length === 0 && <p className="muted">{emptyMessage}</p>}
        {events.map((event) => {
          const joined = currentUser ? event.participants.includes(currentUser.id) : false;
          const full = event.participants.length >= event.capacity;
          return (
            <article
              key={event.id}
              className={selectedEventId === event.id ? 'event-card active' : 'event-card'}
              onClick={() => onSelect(event.id)}
            >
              <div className="event-top-line">
                <strong>{event.title}</strong>
                <span className={`status-pill ${full ? 'full' : 'open'}`}>
                  {full ? '満員' : '参加可能'}
                </span>
              </div>
              <p className="muted">{event.category} / {event.venue}</p>
              <p>{formatDate(event.date)}</p>
              <p className="muted">
                {event.participants.length} / {event.capacity} 名が参加
              </p>
              <div className="inline-actions" onClick={(eventClick) => eventClick.stopPropagation()}>
                {currentUser?.role === 'user' && !joined && !full && (
                  <button className="primary-btn small" onClick={() => onJoin(event.id)}>
                    参加
                  </button>
                )}
                {currentUser?.role === 'user' && joined && (
                  <button className="secondary-btn small" onClick={() => onCancel(event.id)}>
                    キャンセル
                  </button>
                )}
                {currentUser?.role === 'admin' && (
                  <>
                    <button className="secondary-btn small" onClick={() => onEdit(event)}>
                      編集
                    </button>
                    <button className="danger-btn small" onClick={() => onDelete(event.id)}>
                      削除
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function EventDetail({ event, currentUser, onJoin, onCancel, onEdit, onDelete }) {
  if (!event) {
    return (
      <div>
        <div className="section-heading">
          <h2>イベント詳細</h2>
        </div>
        <p className="muted">イベントを選択してください。</p>
      </div>
    );
  }

  const joined = currentUser ? event.participants.includes(currentUser.id) : false;
  const full = event.participants.length >= event.capacity;

  return (
    <div>
      <div className="section-heading">
        <h2>イベント詳細</h2>
        <span className="category-chip">{event.category}</span>
      </div>
      <div className="detail-box">
        <h3>{event.title}</h3>
        <p>{event.description}</p>
        <dl className="detail-grid">
          <div>
            <dt>会場</dt>
            <dd>{event.venue}</dd>
          </div>
          <div>
            <dt>日時</dt>
            <dd>{formatDate(event.date)}</dd>
          </div>
          <div>
            <dt>定員</dt>
            <dd>{event.capacity}名</dd>
          </div>
          <div>
            <dt>参加人数</dt>
            <dd>{event.participants.length}名</dd>
          </div>
        </dl>

        {currentUser?.role === 'user' && !joined && !full && (
          <button className="primary-btn" onClick={() => onJoin(event.id)}>
            このイベントに参加する
          </button>
        )}
        {currentUser?.role === 'user' && joined && (
          <button className="secondary-btn" onClick={() => onCancel(event.id)}>
            参加をキャンセルする
          </button>
        )}
        {currentUser?.role === 'admin' && (
          <div className="inline-actions spaced-top">
            <button className="secondary-btn" onClick={() => onEdit(event)}>
              このイベントを編集する
            </button>
            <button className="danger-btn" onClick={() => onDelete(event.id)}>
              このイベントを削除する
            </button>
          </div>
        )}

        <div className="participant-list">
          <h4>参加者ID</h4>
          {event.participants.length === 0 ? (
            <p className="muted">まだ参加者はいません。</p>
          ) : (
            <ul>
              {event.participants.map((participantId) => {
                const user = DEMO_USERS.find((item) => item.id === participantId);
                return <li key={participantId}>{user?.displayName ?? participantId}</li>;
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminForm({ formData, setFormData, formErrors, onSave, onReset }) {
  return (
    <div>
      <div className="section-heading">
        <h2>{formData.id ? 'イベント編集' : 'イベント作成'}</h2>
        <button className="secondary-btn small" onClick={onReset}>
          新規作成に戻す
        </button>
      </div>
      <form className="stack-form" onSubmit={onSave}>
        <label>
          <span>タイトル</span>
          <input
            value={formData.title}
            onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="例: 新卒歓迎LT会"
          />
          {formErrors.title && <span className="error-text">{formErrors.title}</span>}
        </label>

        <label>
          <span>説明</span>
          <textarea
            rows="4"
            value={formData.description}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, description: event.target.value }))
            }
            placeholder="イベントの目的や内容を入力してください。"
          />
          {formErrors.description && <span className="error-text">{formErrors.description}</span>}
        </label>

        <div className="filters-grid">
          <label>
            <span>会場</span>
            <input
              value={formData.venue}
              onChange={(event) => setFormData((prev) => ({ ...prev, venue: event.target.value }))}
              placeholder="例: 会議室B"
            />
            {formErrors.venue && <span className="error-text">{formErrors.venue}</span>}</label>
          <label>
            <span>カテゴリ</span>
            <select
              value={formData.category}
              onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
            >
              <option value="勉強会">勉強会</option>
              <option value="レビュー">レビュー</option>
              <option value="交流">交流</option>
              <option value="その他">その他</option>
            </select>
          </label>
        </div>

        <div className="filters-grid">
          <label>
            <span>日時</span>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(event) => setFormData((prev) => ({ ...prev, date: event.target.value }))}
            />
            {formErrors.date && <span className="error-text">{formErrors.date}</span>}
          </label>

          <label>
            <span>定員</span>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.capacity}
              onChange={(event) => setFormData((prev) => ({ ...prev, capacity: event.target.value }))}
            />
            {formErrors.capacity && <span className="error-text">{formErrors.capacity}</span>}
          </label>
        </div>

        <div className="inline-actions">
          <button className="primary-btn" type="submit">
            {formData.id ? '更新する' : '作成する'}
          </button>
          <button className="secondary-btn" type="button" onClick={onReset}>
            リセット
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;
