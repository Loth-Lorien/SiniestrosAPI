import { FiX, FiFileText } from 'react-icons/fi';
interface ModalDetalleSiniestroProps {
	isOpen: boolean;
	onClose: () => void;
	siniestroDetalle: any;
	onGenerarBoletin?: (idSiniestro: number) => void;
}

export default function ModalDetalleSiniestro({ isOpen, onClose, siniestroDetalle, onGenerarBoletin }: ModalDetalleSiniestroProps) {
		if (!isOpen || !siniestroDetalle) return null;

		// Calcular monto total estimado solo con pérdidas NO recuperadas
		const montoTotalEstimado = Array.isArray(siniestroDetalle.perdidas)
			? siniestroDetalle.perdidas
					.filter((p: any) => !p.recuperado)
					.reduce((acc: number, p: any) => acc + (p.monto || 0), 0)
			: 0;

		return (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
				<div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-screen overflow-y-auto">
					<div className="p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-3xl font-bold text-gray-900">Detalle del Siniestro #{siniestroDetalle.idSiniestro}</h2>
							<button
								onClick={onClose}
								className="text-gray-400 hover:text-gray-600"
							>
								<FiX className="w-6 h-6" />
							</button>
						</div>

						{/* Información básica del siniestro */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
							{/* Panel izquierdo - Información general */}
							<div className="space-y-6">
								<div className="bg-gray-50 rounded-lg p-6">
									<h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
										<div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
										Información General
									</h3>
									<div className="space-y-3">
										<div className="flex justify-between">
											<span className="font-medium text-gray-600">Fecha:</span>
											<span className="text-gray-900">
												{new Date(siniestroDetalle.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="font-medium text-gray-600">Hora:</span>
											<span className="text-gray-900">
												{siniestroDetalle.hora || '-'}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="font-medium text-gray-600">Sucursal:</span>
											<span className="text-gray-900">{siniestroDetalle.centro}</span>
										</div>
										<div className="flex justify-between">
											<span className="font-medium text-gray-600">Tipo de Siniestro:</span>
											<span className="text-gray-900">{siniestroDetalle.tipoSiniestro}</span>
										</div>
										<div className="flex justify-between">
											<span className="font-medium text-gray-600">Realizado por:</span>
											<span className="text-gray-900">{siniestroDetalle.realizo}</span>
										</div>
										<div className="flex justify-between">
											<span className="font-medium text-gray-600">Estado:</span>
											<span className={`px-3 py-1 rounded-full text-sm font-medium ${
												siniestroDetalle.frustrado 
													? 'bg-yellow-100 text-yellow-800' 
													: 'bg-red-100 text-red-800'
											}`}>
												{siniestroDetalle.frustrado ? 'Frustrado' : 'Consumado'}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="font-medium text-gray-600">Monto Total Estimado:</span>
											<span className="text-2xl font-bold text-green-600">
												${montoTotalEstimado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
											</span>
										</div>
									</div>
								</div>
							</div>

						{/* Panel derecho - Resumen rápido */}
						<div className="space-y-6">
							<div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
								<h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
									<div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
									Resumen Ejecutivo
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div className="bg-white rounded-lg p-4 text-center">
										<div className="text-2xl font-bold text-blue-600">{siniestroDetalle.perdidas?.length || 0}</div>
										<div className="text-sm text-gray-600">Pérdidas Registradas</div>
									</div>
									<div className="bg-white rounded-lg p-4 text-center">
										<div className="text-2xl font-bold text-purple-600">{siniestroDetalle.implicados?.length || 0}</div>
										<div className="text-sm text-gray-600">Implicados</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Pérdidas detalladas */}
					{siniestroDetalle.perdidas && siniestroDetalle.perdidas.length > 0 && (
						<div className="mt-8">
							<h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
								<div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
								Pérdidas Registradas
							</h3>
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
								{siniestroDetalle.perdidas.map((perdida: any, index: number) => (
									<div key={index} className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
										<div className="flex justify-between items-start mb-3">
											<h4 className="font-semibold text-gray-800">{perdida.tipoPerdida}</h4>
											<span className={`px-2 py-1 rounded text-xs font-medium ${
												perdida.recuperado 
													? 'bg-green-100 text-green-800' 
													: 'bg-red-100 text-red-800'
											}`}>
												{perdida.recuperado ? 'Recuperado' : 'No Recuperado'}
											</span>
										</div>
										<div className="space-y-2">
											<div className="flex justify-between">
												<span className="text-gray-600">Monto:</span>
												<span className="font-bold text-red-600">
													${perdida.monto?.toLocaleString('es-ES', { minimumFractionDigits: 2 }) || '0.00'}
												</span>
											</div>
											{perdida.detalle && (
												<div>
													<span className="text-gray-600">Detalle:</span>
													<p className="text-gray-800 text-sm mt-1">{perdida.detalle}</p>
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Implicados detallados */}
					{siniestroDetalle.implicados && siniestroDetalle.implicados.length > 0 && (
						<div className="mt-8">
							<h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
								<div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
								Implicados
							</h3>
							<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
								{siniestroDetalle.implicados.map((implicado: any, index: number) => (
									<div key={index} className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4">
										<h4 className="font-semibold text-gray-800 mb-3">Implicado #{index + 1}</h4>
										<div className="space-y-2">
											<div className="flex justify-between">
												<span className="text-gray-600">Sexo:</span>
												<span className="text-gray-900">{implicado.sexo}</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-600">Edad:</span>
												<span className="text-gray-900">{implicado.rangoEdad}</span>
											</div>
											{implicado.detalle && (
												<div>
													<span className="text-gray-600">Detalle:</span>
													<p className="text-gray-800 text-sm mt-1">{implicado.detalle}</p>
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Botón de cierre y boletín */}
					<div className="mt-8 flex justify-end gap-3">
						{onGenerarBoletin && (
							<button
								onClick={() => onGenerarBoletin(siniestroDetalle.idSiniestro)}
								className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
							>
								<FiFileText className="w-5 h-5" />
								Generar Boletín
							</button>
						)}
						<button
							onClick={onClose}
							className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
						>
							Cerrar
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
