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

function validarTelefono(tel) {
    return /^[0-9]{10,15}$/.test(tel.trim())
}

export default function NuevoCaso() {
    const navigate = useNavigate()
    const { usuario } = useAuth()

    const [form, setForm] = useState({
        nombreSolicitante: usuario?.nombre || '',
        telefono: '',
        correoSolicitante: usuario?.correo || '',
        especie: '',
        otraEspecie: '',
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

    const [archivoFoto, setArchivoFoto] = useState(null)
    const [previstaFoto, setPrevistaFoto] = useState(null)
    const [errores, setErrores] = useState({})
    const [casosSimilares, setCasosSimilares] = useState([])
    const [mostrarAlerta, setMostrarAlerta] = useState(false)
    const [enviando, setEnviando] = useState(false)

    function handleChange(e) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        if (errores[name]) setErrores(prev => ({ ...prev, [name]: '' }))
    }

    function handleFoto(e) {
        const archivo = e.target.files[0]
        if (!archivo) return
        setArchivoFoto(archivo)
        setPrevistaFoto(URL.createObjectURL(archivo))
    }

    function handleCheckbox(value) {
        const ya = form.tipoApoyo.includes(value)
        setForm(prev => ({
            ...prev,
            tipoApoyo: ya ? prev.tipoApoyo.filter(t => t !== value) : [...prev.tipoApoyo, value]
        }))
        if (errores.tipoApoyo) setErrores(prev => ({ ...prev, tipoApoyo: '' }))
    }

    function validar() {
        const e = {}

        if (!form.telefono.trim()) {
            e.telefono = 'El telefono es requerido'
        } else if (!validarTelefono(form.telefono)) {
            e.telefono = 'Ingresa un numero valido (solo digitos, minimo 10 caracteres)'
        }

        if (!form.especie) {
            e.especie = 'Selecciona la especie del animal'
        }
        if (form.especie === 'otro' && !form.otraEspecie.trim()) {
            e.otraEspecie = 'Especifica que tipo de animal es'
        }

        if (!form.condicion) e.condicion = 'Selecciona la condicion del animal'
        if (!form.ubicacion.trim()) e.ubicacion = 'La ubicacion es requerida'
        if (!form.motivo.trim()) e.motivo = 'El motivo es requerido'
        if (!form.situacionActual.trim()) e.situacionActual = 'La situacion actual es requerida'
        if (form.tipoApoyo.length === 0) e.tipoApoyo = 'Selecciona al menos un tipo de apoyo'

        return e
    }

    async function buscarDuplicados() {
        if (!form.especie || !form.ubicacion) return []
        const especieBuscar = form.especie === 'otro' ? form.otraEspecie : form.especie
        try {
            const res = await fetch(
                `http://localhost:3000/api/casos/similares?especie=${encodeURIComponent(especieBuscar)}&ubicacion=${encodeURIComponent(form.ubicacion)}`
            )
            return await res.json()
        } catch { return [] }
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

        let nombreFoto = ''
        if (archivoFoto) {
            try {
                const formData = new FormData()
                formData.append('foto', archivoFoto)
                const resUpload = await fetch('http://localhost:3000/api/upload', { method: 'POST', body: formData })
                const dataUpload = await resUpload.json()
                nombreFoto = dataUpload.nombreArchivo || ''
            } catch (err) { console.error(err) }
        }

        const especieFinal = form.especie === 'otro' ? form.otraEspecie.trim() : form.especie

        const res = await fetch('http://localhost:3000/api/casos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_usuario: usuario?.id,
                nombre_solicitante: form.nombreSolicitante,
                telefono: form.telefono.trim(),
                correo_solicitante: form.correoSolicitante,
                especie: especieFinal,
                edad_aprox: form.edadAprox,
                sexo: form.sexo,
                condicion: form.condicion,
                comportamiento: form.comportamiento,
                ubicacion: form.ubicacion,
                foto: nombreFoto,
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
        border: errores[campo] ? '2px solid #dc2626' : '1px solid #c2cdd5',
        padding: '10px 12px', borderRadius: '8px', width: '100%',
        boxSizing: 'border-box', fontSize: '15px',
        background: errores[campo] ? '#fef2f2' : '#fff', outline: 'none'
    })

    const errMsg = (campo) => errores[campo] ? (
        <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '2px', display: 'block' }}>
            ⚠ {errores[campo]}
        </span>
    ) : null

    const label = (text) => (
        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#303854', display: 'block', marginBottom: '4px' }}>
            {text}
        </label>
    )

    return (
        <div style={{ maxWidth: '620px', margin: '40px auto', padding: '0 20px' }}>
            <h2 style={{ color: '#303854' }}>🐾 Reportar un caso</h2>

            {mostrarAlerta && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '12px', padding: '32px',
                        maxWidth: '480px', width: '90%', boxShadow: '0 8px 40px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ marginTop: 0, color: '#d97706' }}>⚠️ Caso similar detectado</h3>
                        <p>Existe un caso activo con la misma especie en esa zona:</p>
                        {casosSimilares.map(c => (
                            <div key={c.id} style={{
                                border: '1px solid #e5e7eb', borderRadius: '8px',
                                padding: '12px', marginBottom: '8px', background: '#f9fafb'
                            }}>
                                <strong style={{ textTransform: 'capitalize' }}>{c.especie}</strong>
                                <span style={{ marginLeft: '8px', color: '#6b7280', fontSize: '14px' }}>— {c.ubicacion}</span>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#555' }}>Condicion: {c.condicion}</p>
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => { setMostrarAlerta(false); guardarCaso() }}
                                style={{
                                    flex: 1, padding: '10px', background: '#303854', color: '#f6f3ea',
                                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                                }}>
                                Es un animal diferente, crear reporte
                            </button>
                            <button onClick={() => navigate('/dashboard/solicitante')}
                                style={{
                                    padding: '10px 16px', background: '#e5e7eb',
                                    border: 'none', borderRadius: '8px', cursor: 'pointer'
                                }}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {errores.general && (
                <div style={{
                    color: '#dc2626', background: '#fef2f2', padding: '12px',
                    borderRadius: '8px', marginBottom: '16px', border: '1px solid #fecaca'
                }}>
                    {errores.general}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                <h3 style={{ color: '#303854', borderBottom: '2px solid #c2cdd5', paddingBottom: '6px', marginBottom: '4px' }}>
                    Datos del solicitante
                </h3>

                <div>
                    {label('Nombre completo')}
                    <input name="nombreSolicitante" placeholder="Nombre completo"
                        value={form.nombreSolicitante} onChange={handleChange} style={inp('nombreSolicitante')} />
                    {errMsg('nombreSolicitante')}
                </div>

                <div>
                    {label('Telefono *')}
                    <input
                        name="telefono"
                        placeholder="Ej: 7171234567"
                        value={form.telefono}
                        onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '')
                            setForm(prev => ({ ...prev, telefono: val }))
                            if (errores.telefono) setErrores(prev => ({ ...prev, telefono: '' }))
                        }}
                        maxLength={15}
                        style={inp('telefono')}
                    />
                    {errMsg('telefono')}
                </div>

                <div>
                    {label('Correo electronico')}
                    <input name="correoSolicitante" type="email" placeholder="correo@ejemplo.com"
                        value={form.correoSolicitante} onChange={handleChange} style={inp('correoSolicitante')} />
                </div>

                <h3 style={{ color: '#303854', borderBottom: '2px solid #c2cdd5', paddingBottom: '6px', marginTop: '8px', marginBottom: '4px' }}>
                    Datos del animal
                </h3>

                <div>
                    {label('Especie *')}
                    <select name="especie" value={form.especie} onChange={handleChange} style={inp('especie')}>
                        <option value="">Selecciona la especie</option>
                        <option value="perro">Perro</option>
                        <option value="gato">Gato</option>
                        <option value="otro">Otro</option>
                    </select>
                    {errMsg('especie')}
                </div>

                {form.especie === 'otro' && (
                    <div>
                        {label('¿Que tipo de animal es? *')}
                        <input
                            name="otraEspecie"
                            placeholder="Ej: perico, paloma, conejo, tortuga, iguana..."
                            value={form.otraEspecie}
                            onChange={handleChange}
                            style={inp('otraEspecie')}
                        />
                        {errMsg('otraEspecie')}
                    </div>
                )}

                <div>
                    {label('Sexo')}
                    <select name="sexo" value={form.sexo} onChange={handleChange} style={inp('sexo')}>
                        <option value="">Selecciona el sexo</option>
                        <option value="macho">Macho</option>
                        <option value="hembra">Hembra</option>
                        <option value="desconocido">Desconocido</option>
                    </select>
                </div>

                <div>
                    {label('Condicion fisica *')}
                    <select name="condicion" value={form.condicion} onChange={handleChange} style={inp('condicion')}>
                        <option value="">Selecciona la condicion</option>
                        <option value="critica">Critica — necesita atencion inmediata</option>
                        <option value="regular">Regular — necesita atencion pronto</option>
                        <option value="buena">Buena — estable pero necesita apoyo</option>
                    </select>
                    {errMsg('condicion')}
                </div>

                <div>
                    {label('Edad aproximada')}
                    <input name="edadAprox" placeholder="Ej: 2 años, cachorro, adulto mayor"
                        value={form.edadAprox} onChange={handleChange} style={inp('edadAprox')} />
                </div>

                <div>
                    {label('Comportamiento')}
                    <input name="comportamiento" placeholder="Ej: asustado, agresivo, docil, herido"
                        value={form.comportamiento} onChange={handleChange} style={inp('comportamiento')} />
                </div>

                <div>
                    {label('Ubicacion *')}
                    <input name="ubicacion" placeholder="Calle, colonia o referencia cercana"
                        value={form.ubicacion} onChange={handleChange} style={inp('ubicacion')} />
                    {errMsg('ubicacion')}
                </div>

                <div>
                    {label('Foto del animal (opcional)')}
                    <input type="file" accept="image/jpeg,image/png" onChange={handleFoto} />
                    {previstaFoto && (
                        <div style={{ marginTop: '10px' }}>
                            <img src={previstaFoto} alt="Vista previa"
                                style={{
                                    width: '100%', maxHeight: '220px', objectFit: 'cover',
                                    borderRadius: '8px', border: '1px solid #c2cdd5'
                                }} />
                            <button type="button"
                                onClick={() => { setArchivoFoto(null); setPrevistaFoto(null) }}
                                style={{
                                    marginTop: '6px', fontSize: '12px', color: '#dc2626',
                                    background: 'none', border: 'none', cursor: 'pointer'
                                }}>
                                ✕ Quitar foto
                            </button>
                        </div>
                    )}
                </div>

                <h3 style={{ color: '#303854', borderBottom: '2px solid #c2cdd5', paddingBottom: '6px', marginTop: '8px', marginBottom: '4px' }}>
                    Datos de la solicitud
                </h3>

                <div>
                    {label('¿Por que reportas este caso? *')}
                    <textarea name="motivo" placeholder="Describe brevemente por que necesita ayuda este animal"
                        value={form.motivo} onChange={handleChange} rows={3} style={{ ...inp('motipo'), resize: 'vertical' }}
                        style={inp('motivo')} />
                    {errMsg('motivo')}
                </div>

                <div>
                    {label('Situacion actual del animal *')}
                    <textarea name="situacionActual" placeholder="Describe donde esta y como se encuentra ahora mismo"
                        value={form.situacionActual} onChange={handleChange} rows={3} style={inp('situacionActual')} />
                    {errMsg('situacionActual')}
                </div>

                <div>
                    {label('Tiempo estimado en calle')}
                    <select name="tiempoEnCalle" value={form.tiempoEnCalle} onChange={handleChange} style={inp('tiempoEnCalle')}>
                        <option value="">Selecciona una opcion</option>
                        <option value="menos_24h">Menos de 24 horas</option>
                        <option value="entre_24_48h">Entre 24 y 48 horas</option>
                        <option value="mas_48h">Mas de 48 horas</option>
                    </select>
                </div>

                <div>
                    {label('Tipo de apoyo requerido *')}
                    {errores.tipoApoyo && (
                        <span style={{ color: '#dc2626', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                            ⚠ {errores.tipoApoyo}
                        </span>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {TIPOS_APOYO.map(tipo => (
                            <label key={tipo.value} style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                                border: form.tipoApoyo.includes(tipo.value) ? '2px solid #303854' : '1px solid #c2cdd5',
                                background: form.tipoApoyo.includes(tipo.value) ? '#f0f2f8' : '#fff',
                                transition: 'all 0.15s'
                            }}>
                                <input type="checkbox" checked={form.tipoApoyo.includes(tipo.value)}
                                    onChange={() => handleCheckbox(tipo.value)}
                                    style={{ accentColor: '#303854', width: '16px', height: '16px' }} />
                                <span style={{ fontSize: '14px', color: '#303854' }}>{tipo.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <button type="submit" disabled={enviando} style={{
                    marginTop: '8px', padding: '14px', fontSize: '16px', fontWeight: 'bold',
                    cursor: enviando ? 'not-allowed' : 'pointer',
                    background: enviando ? '#9ca3af' : '#303854',
                    color: '#f6f3ea', border: 'none', borderRadius: '10px'
                }}>
                    {enviando ? 'Enviando...' : 'Enviar reporte'}
                </button>
                <button onClick={() => navigate('/dashboard/solicitante')}
                    style={{
                        padding: '10px 16px', background: '#e5e7eb',
                        border: 'none', borderRadius: '8px', cursor: 'pointer'
                    }}>
                    Cancelar
                </button>
            </form>
        </div>
    )
}
