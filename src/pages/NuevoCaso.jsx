import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCasos } from '../context/CasosContext'

const TIPOS_APOYO = [
    { value: 'transporte', label: 'Transporte' },
    { value: 'croquetas', label: 'Croquetas / Insumos' },
    { value: 'adopcion', label: 'Adopción' },
    { value: 'hogar_temporal', label: 'Hogar Temporal' },
    { value: 'donacion', label: 'Donación' },
    { value: 'atencion_veterinaria', label: 'Atención Veterinaria' },
    { value: 'rescate', label: 'Rescate' },
]

export default function NuevoCaso() {
    const navigate = useNavigate()
    const { usuario } = useAuth()
    const { agregarCaso } = useCasos()

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

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    function handleCheckbox(value) {
        const yaSeleccionado = form.tipoApoyo.includes(value)
        setForm({
            ...form,
            tipoApoyo: yaSeleccionado
                ? form.tipoApoyo.filter(t => t !== value)
                : [...form.tipoApoyo, value]
        })
    }

    function validar() {
        const nuevosErrores = {}
        if (!form.telefono) nuevosErrores.telefono = 'Requerido'
        if (!form.especie) nuevosErrores.especie = 'Requerido'
        if (!form.condicion) nuevosErrores.condicion = 'Requerido'
        if (!form.ubicacion) nuevosErrores.ubicacion = 'Requerido'
        if (!form.motivo) nuevosErrores.motivo = 'Requerido'
        if (!form.situacionActual) nuevosErrores.situacionActual = 'Requerido'
        if (form.tipoApoyo.length === 0) nuevosErrores.tipoApoyo = 'Selecciona al menos uno'
        return nuevosErrores
    }

    async function handleSubmit(e) {
        e.preventDefault()
        const nuevosErrores = validar()
        if (Object.keys(nuevosErrores).length > 0) {
            setErrores(nuevosErrores)
            return
        }

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
                tipo_apoyo: form.tipoApoyo
            })
        })

        const data = await res.json()
        if (!res.ok) {
            setErrores({ general: data.mensaje })
            return
        }

        navigate('/dashboard/solicitante')
    }

    const estiloInput = (campo) => ({
        border: errores[campo] ? '2px solid red' : '1px solid #ccc',
        padding: '8px',
        borderRadius: '4px',
        width: '100%',
        boxSizing: 'border-box'
    })

    return (
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
            <h2>🐾 Reportar un caso</h2>

            {errores.general && (
                <p style={{ color: 'red', background: '#fee2e2', padding: '10px', borderRadius: '6px' }}>
                    {errores.general}
                </p>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* BLOQUE 1: Solicitante */}
                <h3>Datos del solicitante</h3>
                <input name="nombreSolicitante" placeholder="Nombre completo" value={form.nombreSolicitante} onChange={handleChange} style={estiloInput('nombreSolicitante')} />
                <input name="telefono" placeholder="Teléfono *" value={form.telefono} onChange={handleChange} style={estiloInput('telefono')} />
                {errores.telefono && <span style={{ color: 'red', fontSize: '12px' }}>{errores.telefono}</span>}
                <input name="correoSolicitante" placeholder="Correo electrónico" value={form.correoSolicitante} onChange={handleChange} style={estiloInput('correoSolicitante')} />

                {/* BLOQUE 2: Animal */}
                <h3>Datos del animal</h3>
                <select name="especie" value={form.especie} onChange={handleChange} style={estiloInput('especie')}>
                    <option value="">Especie *</option>
                    <option value="perro">Perro</option>
                    <option value="gato">Gato</option>
                    <option value="otro">Otro</option>
                </select>
                {errores.especie && <span style={{ color: 'red', fontSize: '12px' }}>{errores.especie}</span>}

                <select name="sexo" value={form.sexo} onChange={handleChange} style={estiloInput('sexo')}>
                    <option value="">Sexo</option>
                    <option value="macho">Macho</option>
                    <option value="hembra">Hembra</option>
                    <option value="desconocido">Desconocido</option>
                </select>

                <select name="condicion" value={form.condicion} onChange={handleChange} style={estiloInput('condicion')}>
                    <option value="">Condición física *</option>
                    <option value="critica">Crítica</option>
                    <option value="regular">Regular</option>
                    <option value="buena">Buena</option>
                </select>
                {errores.condicion && <span style={{ color: 'red', fontSize: '12px' }}>{errores.condicion}</span>}

                <input name="edadAprox" placeholder="Edad aproximada (ej: 2 años)" value={form.edadAprox} onChange={handleChange} style={estiloInput('edadAprox')} />
                <input name="comportamiento" placeholder="Comportamiento (ej: asustado, agresivo, dócil)" value={form.comportamiento} onChange={handleChange} style={estiloInput('comportamiento')} />
                <input name="ubicacion" placeholder="Ubicación (calle, colonia, referencia) *" value={form.ubicacion} onChange={handleChange} style={estiloInput('ubicacion')} />
                {errores.ubicacion && <span style={{ color: 'red', fontSize: '12px' }}>{errores.ubicacion}</span>}

                <div>
                    <label>Foto del animal (opcional)</label>
                    <input type="file" accept="image/*" onChange={(e) => setFotoNombre(e.target.files[0]?.name || '')} style={{ marginTop: '4px' }} />
                </div>

                {/* BLOQUE 3: Solicitud */}
                <h3>Datos de la solicitud</h3>
                <textarea name="motivo" placeholder="¿Por qué reportas este caso? *" value={form.motivo} onChange={handleChange} rows={3} style={estiloInput('motivo')} />
                {errores.motivo && <span style={{ color: 'red', fontSize: '12px' }}>{errores.motivo}</span>}

                <textarea name="situacionActual" placeholder="¿Cuál es la situación actual del animal? *" value={form.situacionActual} onChange={handleChange} rows={3} style={estiloInput('situacionActual')} />
                {errores.situacionActual && <span style={{ color: 'red', fontSize: '12px' }}>{errores.situacionActual}</span>}

                <select name="tiempoEnCalle" value={form.tiempoEnCalle} onChange={handleChange} style={estiloInput('tiempoEnCalle')}>
                    <option value="">Tiempo estimado en calle</option>
                    <option value="menos_24h">Menos de 24 horas</option>
                    <option value="entre_24_48h">Entre 24 y 48 horas</option>
                    <option value="mas_48h">Más de 48 horas</option>
                </select>

                <div>
                    <p style={{ margin: '0 0 8px 0' }}>
                        Tipo de apoyo requerido *
                        {errores.tipoApoyo && <span style={{ color: 'red', fontSize: '12px' }}> — {errores.tipoApoyo}</span>}
                    </p>
                    {TIPOS_APOYO.map(tipo => (
                        <label key={tipo.value} style={{ display: 'block', marginBottom: '4px' }}>
                            <input
                                type="checkbox"
                                checked={form.tipoApoyo.includes(tipo.value)}
                                onChange={() => handleCheckbox(tipo.value)}
                                style={{ marginRight: '8px' }}
                            />
                            {tipo.label}
                        </label>
                    ))}
                </div>

                <button type="submit" style={{ padding: '12px', fontSize: '16px', cursor: 'pointer' }}>
                    Enviar reporte
                </button>
            </form>
        </div>
    )
}