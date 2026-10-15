"""Drop auth_email_verification

Leftover from the passwordless email-code login, unused since the Google OAuth
hard cutover (7adaa559ed82).

Revision ID: 88d4ed8a107c
Revises: b3c4d5e6f7a8
Create Date: 2026-10-15 15:14:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '88d4ed8a107c'
down_revision: Union[str, None] = 'b3c4d5e6f7a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Dropping the table also drops its indexes
    op.drop_table('auth_email_verification', schema='mynab')


def downgrade() -> None:
    op.create_table('auth_email_verification',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('verification_code', sa.String(length=10), nullable=False),
        sa.Column('code_type', sa.String(length=20), nullable=False),
        sa.Column('attempts', sa.Integer(), server_default='0', nullable=False),
        sa.Column('max_attempts', sa.Integer(), server_default='3', nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('auth_email_verification_pkey')),
        schema='mynab'
    )
    op.create_index(op.f('ix_auth_email_verification_email'), 'auth_email_verification', ['email'], schema='mynab')
    op.create_index(op.f('ix_auth_email_verification_code_type'), 'auth_email_verification', ['code_type'], schema='mynab')
    op.create_index(op.f('ix_auth_email_verification_expires_at'), 'auth_email_verification', ['expires_at'], schema='mynab')
