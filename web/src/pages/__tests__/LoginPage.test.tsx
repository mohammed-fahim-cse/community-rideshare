import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../LoginPage';
import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../api/client';

vi.mock('../../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe('LoginPage', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it('sends a code, then moves to the code-entry step', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({ login, verifyOtp: vi.fn() } as unknown as ReturnType<typeof useAuth>);

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '+12025550100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('+12025550100'));
    expect(await screen.findByLabelText('Verification code')).toBeInTheDocument();
  });

  it('shows the error message when sending the code fails, and stays on the phone step', async () => {
    const login = vi.fn().mockRejectedValue(new ApiError(400, 'phone must be a valid phone number'));
    mockedUseAuth.mockReturnValue({ login, verifyOtp: vi.fn() } as unknown as ReturnType<typeof useAuth>);

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: 'garbage' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }));

    expect(await screen.findByText('phone must be a valid phone number')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument();
  });

  it('submits the code via verifyOtp once entered', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    const verifyOtp = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({ login, verifyOtp } as unknown as ReturnType<typeof useAuth>);

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '+12025550100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }));
    await screen.findByLabelText('Verification code');

    fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => expect(verifyOtp).toHaveBeenCalledWith('+12025550100', '123456'));
  });
});
