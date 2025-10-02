// src/utils/franjaUtils.js - UTILIDADES COMPLETAS PARA MANEJO DE FRANJAS
export const franjaUtils = {
  // Generar opciones de hora cada 15 minutos (NECESARIA para AssignmentModal)
  generateTimeOptions() {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const displayString = this.formatTimeDisplay(timeString)
        options.push({ 
          value: timeString, 
          display: displayString 
        })
      }
    }
    return options
  },

  // Calcular total de franjas basado en horario (franjas de 15 minutos)
  calculateTotalFranjas(horaInicio, horaFin) {
    if (!horaInicio || !horaFin) return 0
    
    try {
      const [startHour, startMin] = horaInicio.split(':').map(Number)
      const [endHour, endMin] = horaFin.split(':').map(Number)
      
      const startTotalMin = startHour * 60 + startMin
      const endTotalMin = endHour * 60 + endMin
      
      const totalMinutos = endTotalMin - startTotalMin
      
      // Cada franja es de 15 minutos
      return Math.ceil(totalMinutos / 15)
      
    } catch (error) {
      console.error('❌ Error calculando franjas:', error)
      return 0
    }
  },

  // Calcular duración en minutos entre dos horas
  calculateDuration(horaInicio, horaFin) {
    if (!horaInicio || !horaFin) return null
    
    try {
      const [startHour, startMin] = horaInicio.split(':').map(Number)
      const [endHour, endMin] = horaFin.split(':').map(Number)
      
      const startTotalMin = startHour * 60 + startMin
      const endTotalMin = endHour * 60 + endMin
      
      const totalMinutos = endTotalMin - startTotalMin
      
      if (totalMinutos <= 0) return null
      
      return totalMinutos
      
    } catch (error) {
      console.error('❌ Error calculando duración:', error)
      return null
    }
  },

  // Formatear duración en diferentes formatos
  formatDuration(totalMinutos) {
    if (!totalMinutos || totalMinutos <= 0) {
      return { 
        hours: 0, 
        minutes: 0, 
        franjas: '0 franjas',
        full: '0 minutos' 
      }
    }
    
    const hours = Math.floor(totalMinutos / 60)
    const minutes = totalMinutos % 60
    const franjas = Math.ceil(totalMinutos / 15)
    
    let fullText = ''
    if (hours > 0) {
      fullText = `${hours}h ${minutes}m`
    } else {
      fullText = `${totalMinutos}m`
    }
    
    return {
      hours,
      minutes,
      franjas: `${franjas} franja${franjas !== 1 ? 's' : ''}`,
      full: fullText,
      text: fullText
    }
  },

  // Obtener hora específica de una franja
  getFranjaTime(horaInicio, franjaNum) {
    if (!horaInicio || !franjaNum) return null
    
    try {
      const [startHour, startMin] = horaInicio.split(':').map(Number)
      const startTotalMin = startHour * 60 + startMin
      
      // Cada franja dura 15 minutos, franjaNum empieza en 1
      const franjaStartMin = startTotalMin + ((franjaNum - 1) * 15)
      const franjaEndMin = franjaStartMin + 15
      
      const startHour24 = Math.floor(franjaStartMin / 60)
      const startMin24 = franjaStartMin % 60
      const endHour24 = Math.floor(franjaEndMin / 60)
      const endMin24 = franjaEndMin % 60
      
      const inicio = `${startHour24.toString().padStart(2, '0')}:${startMin24.toString().padStart(2, '0')}`
      const fin = `${endHour24.toString().padStart(2, '0')}:${endMin24.toString().padStart(2, '0')}`
      
      return { inicio, fin }
      
    } catch (error) {
      console.error('❌ Error calculando hora de franja:', error)
      return null
    }
  },

  // Validar si un rango de horas es válido (NECESARIA para AssignmentModal)
  validateTimeRange(horaInicio, horaFin) {
    if (!horaInicio || !horaFin) {
      return { 
        isValid: false, 
        valid: false, 
        error: 'Horas requeridas',
        errors: ['Horas requeridas']
      }
    }
    
    try {
      const [startHour, startMin] = horaInicio.split(':').map(Number)
      const [endHour, endMin] = horaFin.split(':').map(Number)
      
      if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
        return { 
          isValid: false, 
          valid: false, 
          error: 'Horas inválidas (0-23)',
          errors: ['Horas inválidas (0-23)']
        }
      }
      
      if (startMin < 0 || startMin > 59 || endMin < 0 || endMin > 59) {
        return { 
          isValid: false, 
          valid: false, 
          error: 'Minutos inválidos (0-59)',
          errors: ['Minutos inválidos (0-59)']
        }
      }
      
      const startTotalMin = startHour * 60 + startMin
      const endTotalMin = endHour * 60 + endMin
      
      if (endTotalMin <= startTotalMin) {
        return { 
          isValid: false, 
          valid: false, 
          error: 'Hora fin debe ser posterior a hora inicio',
          errors: ['Hora fin debe ser posterior a hora inicio']
        }
      }
      
      const totalMinutos = endTotalMin - startTotalMin
      if (totalMinutos < 15) {
        return { 
          isValid: false, 
          valid: false, 
          error: 'Mínimo 15 minutos de duración',
          errors: ['Mínimo 15 minutos de duración']
        }
      }
      
      return { 
        isValid: true, 
        valid: true, 
        totalMinutos, 
        franjas: Math.ceil(totalMinutos / 15) 
      }
      
    } catch (error) {
      return { 
        isValid: false, 
        valid: false, 
        error: 'Formato de hora inválido (HH:MM)',
        errors: ['Formato de hora inválido (HH:MM)']
      }
    }
  },

  // Crear lista de franjas con sus horarios (NECESARIA para AssignmentModal)
  generateFranjasList(horaInicio, horaFin) {
    const totalFranjas = this.calculateTotalFranjas(horaInicio, horaFin)
    const franjas = []
    
    if (!horaInicio || !horaFin || totalFranjas === 0) {
      return franjas
    }
    
    try {
      const [startHour, startMin] = horaInicio.split(':').map(Number)
      const startTotalMin = startHour * 60 + startMin
      
      for (let i = 1; i <= totalFranjas; i++) {
        const franjaStartMin = startTotalMin + ((i - 1) * 15)
        const franjaEndMin = franjaStartMin + 15
        
        const startHour24 = Math.floor(franjaStartMin / 60)
        const startMin24 = franjaStartMin % 60
        const endHour24 = Math.floor(franjaEndMin / 60)
        const endMin24 = franjaEndMin % 60
        
        const franjaStart = `${startHour24.toString().padStart(2, '0')}:${startMin24.toString().padStart(2, '0')}`
        const franjaEnd = `${endHour24.toString().padStart(2, '0')}:${endMin24.toString().padStart(2, '0')}`
        
        franjas.push({
          number: i,
          numero: i,
          inicio: franjaStart,
          fin: franjaEnd,
          startTime: franjaStart,
          endTime: franjaEnd,
          timeRange: `${franjaStart} - ${franjaEnd}`,
          timeRange12h: `${this.formatTimeDisplay(franjaStart)} - ${this.formatTimeDisplay(franjaEnd)}`,
          startTime12h: this.formatTimeDisplay(franjaStart),
          endTime12h: this.formatTimeDisplay(franjaEnd),
          completed: false
        })
      }
    } catch (error) {
      console.error('❌ Error generando lista de franjas:', error)
    }
    
    return franjas
  },

  // Formatear hora para mostrar (formato 12h) - NECESARIA para AssignmentModal
  formatTimeDisplay(time24) {
    if (!time24) return ''
    
    try {
      const [hour, minute] = time24.split(':')
      const hourNum = parseInt(hour)
      const ampm = hourNum >= 12 ? 'PM' : 'AM'
      const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
      return `${hour12}:${minute} ${ampm}`
    } catch (error) {
      return time24
    }
  },

  // Calcular progreso como porcentaje
  calculateProgressPercentage(franjasCompletadas, totalFranjas) {
    if (!totalFranjas || totalFranjas === 0) return 0
    return Math.round((franjasCompletadas / totalFranjas) * 100)
  },

  // Obtener estado del progreso
  getProgressStatus(franjasCompletadas, totalFranjas) {
    const percentage = this.calculateProgressPercentage(franjasCompletadas, totalFranjas)
    
    if (percentage === 0) {
      return { status: 'not-started', text: 'Sin iniciar', color: '#74b9ff' }
    } else if (percentage < 100) {
      return { status: 'in-progress', text: 'En progreso', color: '#feca57' }
    } else {
      return { status: 'completed', text: 'Completado', color: '#26de81' }
    }
  },

  // Estimar tiempo restante
  estimateRemainingTime(franjasCompletadas, totalFranjas) {
    const franjasRestantes = totalFranjas - franjasCompletadas
    const minutosRestantes = franjasRestantes * 15
    
    if (minutosRestantes <= 0) return 'Completado'
    
    const hours = Math.floor(minutosRestantes / 60)
    const minutes = minutosRestantes % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m restantes`
    } else {
      return `${minutes}m restantes`
    }
  }
}