import React, { useState, useEffect } from 'react';

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ETUDIANT' | 'ENTREPRISE'>('ETUDIANT');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<{ id: number; email: string; role: string } | null>(null);

  // États Étudiant (Profil + CV PDF)
  const [competences, setCompetences] = useState('');
  const [bio, setBio] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUrl, setCvUrl] = useState('');

  // États Offres de stage
  const [offers, setOffers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [techs, setTechs] = useState('');
  const [duree, setDuree] = useState('');
  const [localisation, setLocalisation] = useState('');

  const token = localStorage.getItem('token');

  const fetchOffers = async (query = '') => {
    try {
      const res = await fetch(`http://localhost:5000/api/offers?search=${query}`);
      if (res.ok) setOffers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudentProfile = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/student/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNom(data.nom || '');
        setPrenom(data.prenom || '');
        setCompetences(data.competences || '');
        setBio(data.bio || '');
        setCvUrl(data.cv_url || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOffers();
      if (user.role === 'ETUDIANT') fetchStudentProfile();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const url = isLogin
      ? 'http://localhost:5000/api/auth/login'
      : 'http://localhost:5000/api/auth/register';

    const body = isLogin
      ? { email, password }
      : { email, password, role, nom, prenom, nom_entreprise: nomEntreprise };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`❌ ${data.message || 'Une erreur est survenue'}`);
        return;
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
      } else {
        setMessage('✅ Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        setIsLogin(true);
      }
    } catch {
      setMessage('❌ Impossible de contacter le serveur Backend.');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('nom', nom);
    formData.append('prenom', prenom);
    formData.append('competences', competences);
    formData.append('bio', bio);
    formData.append('cv_url', cvUrl);
    if (cvFile) formData.append('cv', cvFile);

    const res = await fetch('http://localhost:5000/api/student/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (res.ok) {
      setCvUrl(data.cv_url);
      alert('✅ Profil et CV (PDF) mis à jour avec succès !');
    } else {
      alert(`❌ Erreur : ${data.message}`);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/offers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        titre,
        description,
        technologies_requises: techs,
        duree,
        localisation
      })
    });
    if (res.ok) {
      setTitre('');
      setDescription('');
      setTechs('');
      setDuree('');
      setLocalisation('');
      fetchOffers();
      alert('✅ Offre de stage publiée avec succès !');
    }
  };

  // TABLEAU DE BORD UNE FOIS CONNECTÉ
  if (user) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 text-gray-800">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* En-tête */}
          <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-extrabold text-indigo-600">InternConnect</h1>
              <p className="text-sm text-gray-600">
                Connecté en tant que : <strong>{user.email}</strong> | Rôle :{' '}
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">
                  {user.role}
                </span>
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                setUser(null);
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600"
            >
              Déconnexion
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Colonne Gauche : Profil Étudiant OU Création d'offre Entreprise */}
            <div className="bg-white rounded-xl shadow p-6">
              {user.role === 'ETUDIANT' ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <h2 className="text-lg font-bold text-indigo-600 border-b pb-2">
                    🎓 Mon Profil & CV
                  </h2>
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm bg-white text-gray-800"
                  />
                  <input
                    type="text"
                    placeholder="Nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm bg-white text-gray-800"
                  />
                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Compétences (séparées par des virgules)
                    </label>
                    <input
                      type="text"
                      placeholder="React, Node.js, Python, MySQL"
                      value={competences}
                      onChange={(e) => setCompetences(e.target.value)}
                      className="w-full border rounded-lg p-2 text-sm mt-1 bg-white text-gray-800"
                    />
                  </div>
                  <textarea
                    placeholder="Bio / Objectif de stage PFE..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm bg-white text-gray-800"
                    rows={3}
                  />
                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Mon CV (Format PDF uniquement)
                    </label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                      className="w-full text-xs mt-1 text-gray-700"
                    />
                    {cvUrl && (
                      <a
                        href={`http://localhost:5000${cvUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-600 font-semibold underline block mt-2"
                      >
                        📄 Ouvrir mon CV enregistré (PDF)
                      </a>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700"
                  >
                    Enregistrer mon profil
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCreateOffer} className="space-y-4">
                  <h2 className="text-lg font-bold text-indigo-600 border-b pb-2">
                    🏢 Publier une Offre
                  </h2>
                  <input
                    type="text"
                    placeholder="Titre (ex: Stage PFE Fullstack)"
                    value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                    required
                    className="w-full border rounded-lg p-2 text-sm bg-white text-gray-800"
                  />
                  <input
                    type="text"
                    placeholder="Technologies (ex: React, Node.js, MySQL)"
                    value={techs}
                    onChange={(e) => setTechs(e.target.value)}
                    required
                    className="w-full border rounded-lg p-2 text-sm bg-white text-gray-800"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Durée (ex: 6 mois)"
                      value={duree}
                      onChange={(e) => setDuree(e.target.value)}
                      required
                      className="border rounded-lg p-2 text-sm bg-white text-gray-800"
                    />
                    <input
                      type="text"
                      placeholder="Ville (ex: Tanger)"
                      value={localisation}
                      onChange={(e) => setLocalisation(e.target.value)}
                      required
                      className="border rounded-lg p-2 text-sm bg-white text-gray-800"
                    />
                  </div>
                  <textarea
                    placeholder="Description des missions du stage..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="w-full border rounded-lg p-2 text-sm bg-white text-gray-800"
                    rows={4}
                  />
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700"
                  >
                    Publier l'offre
                  </button>
                </form>
              )}
            </div>

            {/* Colonne Droite (2/3) : Catalogue et Recherche d'offres */}
            <div className="md:col-span-2 bg-white rounded-xl shadow p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-3 gap-2">
                <h2 className="text-lg font-bold text-gray-800">
                  📋 Catalogue des Offres de Stage ({offers.length})
                </h2>
                <input
                  type="text"
                  placeholder="🔍 Filtrer par techno, ville, titre..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    fetchOffers(e.target.value);
                  }}
                  className="border rounded-lg px-3 py-1.5 text-sm w-64 bg-white text-gray-800"
                />
              </div>

              {offers.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  Aucune offre de stage publiée pour le moment. Connectez-vous avec un compte Entreprise pour en publier une !
                </p>
              ) : (
                <div className="space-y-4">
                  {offers.map((offer) => (
                    <div key={offer.id} className="border rounded-xl p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-indigo-600 text-base">{offer.titre}</h3>
                          <p className="text-xs text-gray-500 font-medium">
                            🏢 {offer.nom_entreprise} • 📍 {offer.localisation} • ⏱️ {offer.duree}
                          </p>
                        </div>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-semibold">
                          {offer.statut}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">{offer.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {offer.technologies_requises.split(',').map((t: string, i: number) => (
                          <span
                            key={i}
                            className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-medium"
                          >
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PAGE DE CONNEXION / INSCRIPTION
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4 text-gray-800">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h1 className="text-3xl font-extrabold text-center text-indigo-600 mb-2">InternConnect</h1>
        <p className="text-center text-gray-500 mb-6">
          Plateforme de gestion et recommandation de stages
        </p>

        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setMessage(''); }}
            className={`w-1/2 py-2 rounded-md text-sm font-medium transition ${
              isLogin ? 'bg-white shadow text-indigo-600' : 'text-gray-600'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setMessage(''); }}
            className={`w-1/2 py-2 rounded-md text-sm font-medium transition ${
              !isLogin ? 'bg-white shadow text-indigo-600' : 'text-gray-600'
            }`}
          >
            Inscription
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 text-sm text-gray-800 border border-blue-200">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vous êtes :</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'ETUDIANT' | 'ENTREPRISE')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                >
                  <option value="ETUDIANT">🎓 Étudiant</option>
                  <option value="ENTREPRISE">🏢 Entreprise</option>
                </select>
              </div>

              {role === 'ETUDIANT' ? (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    required
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  />
                  <input
                    type="text"
                    placeholder="Nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Nom de l'entreprise"
                  value={nomEntreprise}
                  onChange={(e) => setNomEntreprise(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                />
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="exemple@ecole.ma"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition"
          >
            {isLogin ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
}