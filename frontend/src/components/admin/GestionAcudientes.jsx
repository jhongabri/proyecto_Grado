import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { UserIcon, LinkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function GestionAcudientes({ onBack }) {
    const [acudientes, setAcudientes] = useState([]);
    const [ninos, setNinos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [linking, setLinking] = useState(null); // id_usuario being linked

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [acudRes, ninoRes] = await Promise.all([
                    API.get('/admin/acudientes'),
                    API.get('/ninos')
                ]);
                setAcudientes(acudRes.data);
                setNinos(ninoRes.data);
            } catch (error) {
                console.error("Error fetching acudientes management data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLink = async (idUsuario, idNino) => {
        setLinking(idUsuario);
        try {
            await API.put('/admin/acudientes/vincular', { id_usuario: idUsuario, id_nino: idNino });
            // Update local state
            const nino = ninos.find(n => n.id_nino == idNino);
            setAcudientes(acudientes.map(a => 
                a.id_usuario === idUsuario 
                ? { ...a, id_nino: idNino, nino_nombres: nino?.nombres, nino_apellidos: nino?.apellidos } 
                : a
            ));
        } catch (error) {
            alert("Error al vincular: " + (error.response?.data?.message || error.message));
        } finally {
            setLinking(null);
        }
    };

    const filteredAcudientes = acudientes.filter(a => 
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.correo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Gestión de Acudientes</h2>
                    <p className="text-sm text-slate-500">Vincula padres con sus hijos registrados</p>
                </div>
                <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Volver
                </button>
            </div>

            <div className="p-6">
                <div className="relative mb-6">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar acudiente por nombre o correo..." 
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-slate-500">Cargando acudientes...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                    <th className="pb-3 pl-2">Acudiente</th>
                                    <th className="pb-3">Contacto</th>
                                    <th className="pb-3">Hijo Vinculado</th>
                                    <th className="pb-3 text-right pr-2">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredAcudientes.map((a) => (
                                    <tr key={a.id_usuario} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 pl-2">
                                            <div className="flex items-center">
                                                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 font-bold text-sm">
                                                    {a.nombre.charAt(0)}
                                                </div>
                                                <span className="font-semibold text-slate-700">{a.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm text-slate-500">{a.correo}</td>
                                        <td className="py-4">
                                            {a.id_nino ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                                                    <UserIcon className="w-3 h-3 mr-1" />
                                                    {a.nino_nombres} {a.nino_apellidos}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium text-slate-400 italic">No vinculado</span>
                                            )}
                                        </td>
                                        <td className="py-4 text-right pr-2">
                                            <select 
                                                className="text-xs border border-slate-200 rounded-lg p-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
                                                value={a.id_nino || ""}
                                                disabled={linking === a.id_usuario}
                                                onChange={(e) => handleLink(a.id_usuario, e.target.value)}
                                            >
                                                <option value="">Vincular con...</option>
                                                {ninos.map(n => (
                                                    <option key={n.id_nino} value={n.id_nino}>
                                                        {n.nombres} {n.apellidos}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
