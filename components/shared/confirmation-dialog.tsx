'use client';

import { useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

/**
 * Confirmation Dialog for Destructive Actions
 * 
 * Provides a safe confirmation wrapper for dangerous admin operations.
 * Supports warnings and conditional confirmation.
 */

interface ConfirmationDialogProps {
  /** Trigger button */
  trigger?: React.ReactNode;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description: string;
  /** Warning message shown after description */
  warning?: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Whether to show a second confirmation for dangerous actions */
  doubleConfirm?: boolean;
  /** Text that must be typed to confirm (for double confirm) */
  doubleConfirmText?: string;
  /** Whether the action is destructive */
  destructive?: boolean;
  /** Callback when confirmed */
  onConfirm: () => void | Promise<void>;
  /** Loading state during confirmation */
  loading?: boolean;
  /** Icon to show */
  icon?: 'warning' | 'danger' | 'info';
}

export function ConfirmationDialog({
  trigger,
  title,
  description,
  warning,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  doubleConfirm = false,
  doubleConfirmText = 'CONFIRMAR',
  destructive = false,
  onConfirm,
  loading = false,
  icon = 'warning',
}: ConfirmationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const handleConfirm = useCallback(async () => {
    logger.info('CONFIRM_DIALOG', `Confirmed action: ${title}`);
    try {
      await onConfirm();
    } catch (error) {
      logger.error('CONFIRM_DIALOG', `Action failed: ${title}`, error);
      throw error; // Re-throw to let caller handle
    }
  }, [onConfirm, title]);

  const getIcon = () => {
    switch (icon) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '⚡';
      case 'info':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  const canConfirm = !doubleConfirm || confirmInput === doubleConfirmText;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span>{getIcon()}</span>
            <span>{title}</span>
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {warning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800 font-medium">{warning}</p>
          </div>
        )}

        {doubleConfirm && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Escribe <code className="bg-slate-100 px-1 rounded">{doubleConfirmText}</code> para confirmar:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={doubleConfirmText}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={!canConfirm || loading}
            className={
              destructive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : undefined
            }
          >
            {loading ? 'Procesando...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Pre-configured confirmation for session closure
 */
interface SessionCloseConfirmationProps {
  openMotionsCount: number;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function SessionCloseConfirmation({
  openMotionsCount,
  onConfirm,
  loading = false,
}: SessionCloseConfirmationProps) {
  const hasActiveMotions = openMotionsCount > 0;

  return (
    <ConfirmationDialog
      title="Cerrar Sesión"
      description="¿Estás seguro de que deseas cerrar esta sesión parlamentario?"
warning={
        hasActiveMotions
          ? `⚠️ Hay ${openMotionsCount} moci${openMotionsCount === 1 ? 'ón' : 'ones'} abierta${openMotionsCount === 1 ? '' : 's'}. Al cerrar la sesión se cerrarán todas las votaciones activas.`
          : undefined
      }
      confirmText="Cerrar Sesión"
      destructive={true}
      doubleConfirm={hasActiveMotions}
      doubleConfirmText="CERRAR"
      onConfirm={onConfirm}
      loading={loading}
      icon="danger"
    />
  );
}

/**
 * Pre-configured confirmation for motion closure
 */
interface MotionCloseConfirmationProps {
  motionTitle: string;
  totalVotes: number;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function MotionCloseConfirmation({
  motionTitle,
  totalVotes,
  onConfirm,
  loading = false,
}: MotionCloseConfirmationProps) {
  return (
    <ConfirmationDialog
      title="Cerrar Votación"
      description={`¿Estás seguro de que deseas cerrar la votación de "${motionTitle}"?`}
      warning={
        totalVotes > 0
          ? `⚠️ Se han registrado ${totalVotes} voto${
              totalVotes === 1 ? '' : 's'
            }. Una vez cerrada, no se podrán registrar más votos.`
          : '⚠️ No hay votos registrados. ¿Estás seguro de cerrar esta votación?'
      }
      confirmText="Cerrar Votación"
      destructive={true}
      doubleConfirm={true}
      doubleConfirmText="CERRAR"
      onConfirm={onConfirm}
      loading={loading}
      icon="danger"
    />
  );
}
