-- =============================================
-- Tabla user_sessions: Registro de sesiones de usuario
-- Almacena datos de inicio/fin de sesión para análisis de uso
-- =============================================

-- Crear la tabla de sesiones
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  duration_minutes INTEGER DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_start ON user_sessions(session_start DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_start ON user_sessions(user_id, session_start DESC);

-- Habilitar RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Política para lectura (admin puede ver todo)
CREATE POLICY "Admins can view all sessions" ON user_sessions
  FOR SELECT
  USING (true);

-- Política para inserción 
CREATE POLICY "Users can create their sessions" ON user_sessions
  FOR INSERT
  WITH CHECK (true);

-- Política para actualización
CREATE POLICY "Users can update their sessions" ON user_sessions
  FOR UPDATE
  USING (true);

-- Comentarios
COMMENT ON TABLE user_sessions IS 'Registro de sesiones de usuario para análisis de uso y estadísticas';
COMMENT ON COLUMN user_sessions.duration_minutes IS 'Duración calculada de la sesión en minutos (session_end - session_start)';
COMMENT ON COLUMN user_sessions.session_end IS 'Se actualiza al cerrar sesión o por inactividad (heartbeat)';

-- Función para actualizar duration_minutes automáticamente
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_end IS NOT NULL AND OLD.session_end IS NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.session_end - NEW.session_start)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular duración automáticamente
DROP TRIGGER IF EXISTS trigger_calculate_session_duration ON user_sessions;
CREATE TRIGGER trigger_calculate_session_duration
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_duration();

