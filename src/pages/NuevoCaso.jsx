import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const TIPOS_APOYO = [
    { value: 'transporte', label: 'Transporte' },
    { value: 'croquetas', label: 'Croquetas / Insumos' },
    { value: 'adopcion', label: 'Adopcion' },
    { value: 'hogar_temporal', label: 'Hogar Temporal' },
    { value: 'donacion', label: 'Donacion' },
    { value: 'atencion_veterinaria', label: 'Atencion Veterinaria' },
    { value: 'rescate', label: 'Rescate' },
]

export default function NuevoCaso() {
    const navigate = useNavigate()
    const { usuario } = useAuth()

    const [form, setForm] = useState({
        nombreSolicitante: usuario?.nombre || '',
        telefono: '',
        correoSolicitante: usuario?.correo || '',
        especie: '',
        edadAprox: '',
        sexo: '',
        condicion: '',
        comportamiento: '',
        ubicacion: '',
        motivo: '',
        situacionActual: '',
        tiempoEnCalle: '',
        tipoApoyo: [],
    })

    const [fotoNombre, setFotoNombre] = useState('')
    const [errores, setErrores] = useState({})
    const [casosSimilares, setCasosSimilares] = useState([])
    const [mostrarAlerta, setMostrarAlerta] = useState(false)
    const [enviando, setEnviando] = useState(false)

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    function handleCheckbox(value) {
        const ya = form.tipoApoyo.includes(value)
        setForm({
            ...form,
            tipoApoyo: ya
                ? form.tipoApoyo.filter(t => t !== value)
                : [...form.tipoApoyo, value]
        })
    }

    function validar() {
        const e = {}
        if (!form.telefono) e.telefono = 'Requerido'
        if (!form.especie) e.especie = 'Requerido'
        if (!form.condicion) e.condicion = 'Requerido'
        if (!form.ubicacion) e.ubicacion = 'Requerido'
        if (!form.motivo) e.motivo = 'Requerido'
        if (!form.situacionActual) e.situacionActual = 'Requerido'
        if (form.tipoApoyo.length === 0) e.tipoApoyo = 'Selecciona al menos uno'
        return e
    }

    async function buscarDuplicados() {
        if (!form.especie || !form.ubicacion) return []
        try {
            const res = await fetch(
                `http://localhost:3000/api/casos/similares?especie=${encodeURIComponent(form.especie)}&ubicacion=${encodeURIComponent(form.ubicacion)}`
            )
            return await res.json()
        } catch {
            return []
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        const nuevosErrores = validar()
        if (Object.keys(nuevosErrores).length > 0) {
            setErrores(nuevosErrores)
            return
        }

        const similares = await buscarDuplicados()
        if (similares.length > 0) {
            setCasosSimilares(similares)
            setMostrarAlerta(true)
            return
        }

        await guardarCaso()
    }

    async function guardarCaso() {
        setEnviando(true)
        const res = await fetch('http://localhost:3000/api/casos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_usuario: usuario?.id,
                nombre_solicitante: form.nombreSolicitante,
                telefono: form.telefono,
                correo_solicitante: form.correoSolicitante,
                especie: form.especie,
                edad_aprox: form.edadAprox,
                sexo: form.sexo,
                condicion: form.condicion,
                comportamiento: form.comportamiento,
                ubicacion: form.ubicacion,
                foto: fotoNombre,
                motivo: form.motivo,
                situacion_actual: form.situacionActual,
                tiempo_en_calle: form.tiempoEnCalle,
                tipo_apoyo: form.tipoApoyo,
            })
        })
        setEnviando(false)
        if (res.ok) {
            navigate('/dashboard/solicitante')
        } else {
            const data = await res.json()
            setErrores({ general: data.mensaje })
        }
    }

    const inp = (campo) => ({
        border: errores[campo] ? '2px solid red' : '1px solid #ccc',
        padding: '8px', borderRadius: '4px', width: '100%', boxSizing: 'border-box'
    })

    return (
        <div style={{ maxWidth: '620px', margin: '40px auto', padding: '0 20px' }}>
            <h2>🐾 Reportar un caso</h2>

            {/* Modal alerta de duplicado */}
            {mostrarAlerta && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '12px',
                        padding: '32px', maxWidth: '480px', width: '90%'
                    }}>
                        <h3 style={{ marginTop: 0, color: '#d97706' }}>⚠️ Caso similar detectado</h3>
                        <p>Existe un caso activo con la misma especie en esa zona:</p>
                        {casosSimilares.map(c => (
                            <div key={c.id} style={{
                                border: '1px solid #e5e7eb', borderRadius: '8px',
                                padding: '12px', marginBottom: '8px', background: '#f9fafb'
                            }}>
                                <strong style={{ textTransform: 'capitalize' }}>{c.especie}</strong>
                                <span style={{ marginLeft: '8px', color: '#6b7280', fontSize: '14px' }}>
                                    — {c.ubicacion}
                                </span>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#555' }}>
                                    Condicion: {c.condicion}
                                </p>
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                onClick={() => { setMostrarAlerta(false); guardarCaso() }}
                                style={{
                                    flex: 1, padding: '10px', background: '#2563eb', color: '#fff',
                                    border: 'none', borderRadius: '6px', cursor: 'pointer'
                                }}
                            >
                                Es un animal diferente, crear reporte
                            </button>
                            <button
                                onClick={() => navigate('/dashboard/solicitante')}
                                style={{
                                    padding: '10px 16px', background: '#e5e7eb',
                                    border: 'none', borderRadius: '6px', cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {errores.general && (
                <p style={{ color: 'red', background: '#fee2e2', padding: '10px', borderRadius: '6px' }}>
                    {errores.general}
                </p>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                <h3>Datos del solicitante</h3>
                <input name="nombreSolicitante" placeholder="Nombre completo" value={form.nombreSolicitante} onChange={handleChange} style={inp('nombreSolicitante')} />
                <input name="telefono" placeholder="Telefono *" value={form.telefono} onChange={handleChange} style={inp('telefono')} />
                {errores.telefono && <span style={{ color: 'red', fontSize: '12px' }}>{errores.telefono}</span>}
                <input name="correoSolicitante" placeholder="Correo electronico" value={form.correoSolicitante} onChange={handleChange} style={inp('correoSolicitante')} />

                <h3>Datos del animal</h3>
                <select name="especie" value={form.especie} onChange={handleChange} style={inp('especie')}>
                    <option value="">Especie *</option>
                    <option value="perro">Perro</option>
                    <option value="gato">Gato</option>
                    <option value="otro">Otro</option>
                </select>
                {errores.especie && <span style={{ color: 'red', fontSize: '12px' }}>{errores.especie}</span>}

                <select name="sexo" value={form.sexo} onChange={handleChange} style={inp('sexo')}>
                    <option value="">Sexo</option>
                    <option value="macho">Macho</option>
                    <option value="hembra">Hembra</option>
                    <option value="desconocido">Desconocido</option>
                </select>

                <select name="condicion" value={form.condicion} onChange={handleChange} style={inp('condicion')}>
                    <option value="">Condicion fisica *</option>
                    <option value="critica">Critica</option>
                    <option value="regular">Regular</option>
                    <option value="buena">Buena</option>
                </select>
                {errores.condicion && <span style={{ color: 'red', fontSize: '12px' }}>{errores.condicion}</span>}

                <input name="edadAprox" placeholder="Edad aproximada (ej: 2 años)" value={form.edadAprox} onChange={handleChange} style={inp('edadAprox')} />
                <input name="comportamiento" placeholder="Comportamiento (ej: asustado, docil)" value={form.comportamiento} onChange={handleChange} style={inp('comportamiento')} />
                <input name="ubicacion" placeholder="Ubicacion (calle, colonia, referencia) *" value={form.ubicacion} onChange={handleChange} style={inp('ubicacion')} />
                {errores.ubicacion && <span style={{ color: 'red', fontSize: '12px' }}>{errores.ubicacion}</span>}

                <div>
                    <label>Foto del animal (opcional)</label>
                    <input type="file" accept="image/*" onChange={e => setFotoNombre(e.target.files[0]?.name || '')} style={{ marginTop: '4px' }} />
                </div>

                <h3>Datos de la solicitud</h3>
                <textarea name="motivo" placeholder="¿Por que reportas este caso? *" value={form.motivo} onChange={handleChange} rows={3} style={inp('motivo')} />
                {errores.motivo && <span style={{ color: 'red', fontSize: '12px' }}>{errores.motivo}</span>}

                <textarea name="situacionActual" placeholder="¿Cual es la situacion actual del animal? *" value={form.situacionActual} onChange={handleChange} rows={3} style={inp('situacionActual')} />
                {errores.situacionActual && <span style={{ color: 'red', fontSize: '12px' }}>{errores.situacionActual}</span>}

                <select name="tiempoEnCalle" value={form.tiempoEnCalle} onChange={handleChange} style={inp('tiempoEnCalle')}>
                    <option value="">Tiempo estimado en calle</option>
                    <option value="menos_24h">Menos de 24 horas</option>
                    <option value="entre_24_48h">Entre 24 y 48 horas</option>
                    <option value="mas_48h">Mas de 48 horas</option>
                </select>

                <div>
                    <p style={{ margin: '0 0 8px 0' }}>
                        Tipo de apoyo requerido *
                        {errores.tipoApoyo && <span style={{ color: 'red', fontSize: '12px' }}> — {errores.tipoApoyo}</span>}
                    </p>
                    {TIPOS_APOYO.map(tipo => (
                        <label key={tipo.value} style={{ display: 'block', marginBottom: '4px' }}>
                            <input type="checkbox" checked={form.tipoApoyo.includes(tipo.value)} onChange={() => handleCheckbox(tipo.value)} style={{ marginRight: '8px' }} />
                            {tipo.label}
                        </label>
                    ))}
                </div>

                <button type="submit" disabled={enviando} style={{ padding: '12px', fontSize: '16px', cursor: 'pointer' }}>
                    {enviando ? 'Enviando...' : 'Enviar reporte'}
                </button>
            </form>
        </div>
    )
}
